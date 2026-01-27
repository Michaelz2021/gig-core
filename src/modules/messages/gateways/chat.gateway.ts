import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../messages.service';
import { Inject } from '@nestjs/common';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.userEmail = payload.email;

      // Store user connection
      this.connectedUsers.set(client.userId, client.id);
      
      // Join user's personal room for direct messages
      await client.join(`user:${client.userId}`);

      // Update online status in Redis
      if (this.redisClient) {
        await this.redisClient.setEx(`online:${client.userId}`, 300, '1'); // 5 minutes
      }

      this.logger.log(`User ${client.userId} connected (socket: ${client.id})`);

      // Send offline messages if any
      await this.sendOfflineMessages(client.userId);

      // Notify user is online
      this.server.emit('user:online', { userId: client.userId });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      
      // Remove online status from Redis
      if (this.redisClient) {
        await this.redisClient.del(`online:${client.userId}`);
      }

      this.logger.log(`User ${client.userId} disconnected`);
      this.server.emit('user:offline', { userId: client.userId });
    }
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @MessageBody() data: { roomId: string; content: string; messageType?: string; attachmentUrl?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      // Save message to database
      const message = await this.messagesService.sendChatMessage(
        data.roomId,
        client.userId,
        data.content,
        data.messageType || 'TEXT',
      );

      // Update message with attachment if provided
      if (data.attachmentUrl) {
        await this.messagesService.updateMessageAttachment(message.messageId, data.attachmentUrl);
      }

      // Get room details
      const room = await this.messagesService.findOneChatRoom(data.roomId, client.userId);
      const receiverId = room.user1Id === client.userId ? room.user2Id : room.user1Id;

      // Check if receiver is online
      const receiverSocketId = this.connectedUsers.get(receiverId);
      const isReceiverOnline = receiverSocketId && this.server.sockets.sockets.has(receiverSocketId);

      if (isReceiverOnline) {
        // Send real-time message to receiver
        this.server.to(`user:${receiverId}`).emit('message:new', {
          messageId: message.messageId,
          roomId: data.roomId,
          senderId: client.userId,
          content: data.content,
          messageType: data.messageType || 'TEXT',
          attachmentUrl: data.attachmentUrl,
          timestamp: message.timestamp,
        });
      } else {
        // Store in offline queue
        await this.storeOfflineMessage(receiverId, {
          messageId: message.messageId,
          roomId: data.roomId,
          senderId: client.userId,
          content: data.content,
          messageType: data.messageType || 'TEXT',
          attachmentUrl: data.attachmentUrl,
          timestamp: message.timestamp,
        });
      }

      // Send confirmation to sender
      return {
        success: true,
        messageId: message.messageId,
        timestamp: message.timestamp,
      };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      return { error: error.message };
    }
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      await this.messagesService.markAsRead(client.userId, data.messageId);
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return;
    }

    try {
      const room = await this.messagesService.findOneChatRoom(data.roomId, client.userId);
      const receiverId = room.user1Id === client.userId ? room.user2Id : room.user1Id;
      
      this.server.to(`user:${receiverId}`).emit('typing:start', {
        roomId: data.roomId,
        userId: client.userId,
      });
    } catch (error) {
      this.logger.error(`Error handling typing: ${error.message}`);
    }
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return;
    }

    try {
      const room = await this.messagesService.findOneChatRoom(data.roomId, client.userId);
      const receiverId = room.user1Id === client.userId ? room.user2Id : room.user1Id;
      
      this.server.to(`user:${receiverId}`).emit('typing:stop', {
        roomId: data.roomId,
        userId: client.userId,
      });
    } catch (error) {
      this.logger.error(`Error handling typing stop: ${error.message}`);
    }
  }

  @SubscribeMessage('room:join')
  async handleRoomJoin(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      // Verify user has access to this room
      await this.messagesService.findOneChatRoom(data.roomId, client.userId);
      
      // Join room
      await client.join(`room:${data.roomId}`);
      
      return { success: true, roomId: data.roomId };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('room:leave')
  async handleRoomLeave(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    await client.leave(`room:${data.roomId}`);
    return { success: true };
  }

  // Helper methods
  private extractTokenFromSocket(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return client.handshake.auth?.token || null;
  }

  private async storeOfflineMessage(userId: string, message: any) {
    if (!this.redisClient) return;

    const key = `offline:messages:${userId}`;
    await this.redisClient.lPush(key, JSON.stringify(message));
    await this.redisClient.expire(key, 86400); // 24 hours
  }

  private async sendOfflineMessages(userId: string) {
    if (!this.redisClient) return;

    const key = `offline:messages:${userId}`;
    const messages = await this.redisClient.lRange(key, 0, -1);

    if (messages.length > 0) {
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        const parsedMessages = messages.map((msg: string) => JSON.parse(msg));
        this.server.to(socketId).emit('messages:offline', parsedMessages);
        
        // Clear offline messages
        await this.redisClient.del(key);
      }
    }
  }

  // Public method to check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Public method to get online users
  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}

