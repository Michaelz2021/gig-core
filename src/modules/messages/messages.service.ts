import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { ChatRoom } from './entities/chat-room.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
  ) {}

  async send(
    senderId: string,
    receiverId: string,
    content: string,
    bookingId?: string,
  ): Promise<Message> {
    // Find or create ChatRoom
    let room = await this.chatRoomRepository.findOne({
      where: [
        { user1Id: senderId, user2Id: receiverId },
        { user1Id: receiverId, user2Id: senderId },
      ],
    });

    if (!room) {
      room = this.chatRoomRepository.create({
        user1Id: senderId,
        user2Id: receiverId,
        relatedBookingId: bookingId,
      });
      room = await this.chatRoomRepository.save(room);
    }

    // Create Message
    const message = this.messageRepository.create({
      roomId: room.id,
      senderId,
      content,
      messageText: content,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update ChatRoom's lastMessageAt
    room.lastMessageAt = new Date();
    await this.chatRoomRepository.save(room);

    return savedMessage;
  }

  async findByUser(userId: string, otherUserId?: string): Promise<Message[]> {
    const query = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.room', 'room')
      .where('(room.user1Id = :userId OR room.user2Id = :userId)', { userId })
      .orderBy('message.createdAt', 'DESC');

    if (otherUserId) {
      query.andWhere(
        '(room.user1Id = :otherUserId OR room.user2Id = :otherUserId)',
        { otherUserId }
      );
    }

    return query.getMany();
  }

  async markAsRead(userId: string, messageId: string): Promise<Message | null> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['room'],
    });

    if (!message) {
      return null;
    }

    // Check if userId is the receiver in the message's room
    const isReceiver = message.room.user1Id === userId || message.room.user2Id === userId;
    const isSender = message.senderId === userId;

    if (isReceiver && !isSender && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      return this.messageRepository.save(message);
    }

    return message;
  }

  // Chat Rooms APIs
  async findAllChatRooms(userId: string) {
    const [items, total] = await this.chatRoomRepository.findAndCount({
      where: [
        { user1Id: userId },
        { user2Id: userId },
      ],
      relations: ['user1', 'user2'],
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
    });

    return { items, total };
  }

  async findOneChatRoom(id: string, userId: string) {
    const room = await this.chatRoomRepository.findOne({
      where: { id },
      relations: ['user1', 'user2'],
    });

    if (!room) {
      throw new NotFoundException(`Chat room with ID ${id} not found`);
    }

    if (room.user1Id !== userId && room.user2Id !== userId) {
      throw new BadRequestException('You are not authorized to access this chat room');
    }

    return room;
  }

  async getOrCreateChatRoom(user1Id: string, user2Id: string, bookingId?: string, auctionId?: string) {
    let room = await this.chatRoomRepository.findOne({
      where: [
        { user1Id, user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],
    });

    if (!room) {
      room = this.chatRoomRepository.create({
        user1Id,
        user2Id,
        relatedBookingId: bookingId,
        relatedAuctionId: auctionId,
      });
      room = await this.chatRoomRepository.save(room);
    }

    return room;
  }

  // Chats API (for compatibility with API spec)
  async findAllChats(userId: string) {
    const rooms = await this.findAllChatRooms(userId);
    
    const chats = await Promise.all(
      rooms.items.map(async (room) => {
        const otherUserId = room.user1Id === userId ? room.user2Id : room.user1Id;
        const otherUser = room.user1Id === userId ? room.user2 : room.user1;
        
        // Get last message
        const lastMessage = await this.messageRepository.findOne({
          where: { roomId: room.id },
          order: { createdAt: 'DESC' },
        });

        return {
          chatId: room.id,
          participantId: otherUserId,
          participantName: otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Unknown',
          participantImage: otherUser?.profileImage,
          lastMessage: lastMessage?.messageText || '',
          lastMessageTime: lastMessage?.createdAt || room.lastMessageAt,
          // 마지막 메시지의 송신자/수신자 정보 추가
          lastMessageSenderId: lastMessage?.senderId || null,
          lastMessageReceiverId: lastMessage?.receiverId || null,
          isLastMessageSentByMe: lastMessage ? lastMessage.senderId === userId : null,
          unreadCount: room.user1Id === userId ? room.unreadCountUser1 : room.unreadCountUser2,
          isOnline: false, // TODO: Implement online status
          transactionId: room.relatedBookingId,
        };
      })
    );

    return { chats };
  }

  async getChatMessages(chatId: string, userId: string, page = 1, limit = 50) {
    const room = await this.findOneChatRoom(chatId, userId);

    const skip = (page - 1) * limit;
    const [messages, total] = await this.messageRepository.findAndCount({
      where: { roomId: chatId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const formattedMessages = messages.reverse().map((msg) => ({
      messageId: msg.id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      senderName: msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'Unknown',
      content: msg.messageText || msg.content,
      type: msg.messageType || 'TEXT',
      timestamp: msg.createdAt,
      isRead: msg.isRead,
      isSentByMe: msg.senderId === userId,
    }));

    return {
      messages: formattedMessages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async sendChatMessage(chatId: string, senderId: string, content: string, type = 'TEXT', attachmentUrl?: string) {
    const room = await this.findOneChatRoom(chatId, senderId);

    // Determine receiver ID
    const receiverId = room.user1Id === senderId ? room.user2Id : room.user1Id;

    const message = this.messageRepository.create({
      roomId: chatId,
      senderId,
      receiverId,
      content,
      messageText: content,
      messageType: type as any,
      attachmentUrl,
      attachmentType: attachmentUrl ? this.getAttachmentType(attachmentUrl) : null,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update room last message
    room.lastMessageAt = new Date();
    if (room.user1Id === senderId) {
      room.unreadCountUser2 += 1;
    } else {
      room.unreadCountUser1 += 1;
    }
    await this.chatRoomRepository.save(room);

    return {
      messageId: savedMessage.id,
      timestamp: savedMessage.createdAt,
    };
  }

  async updateMessageAttachment(messageId: string, attachmentUrl: string) {
    const message = await this.messageRepository.findOne({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    message.attachmentUrl = attachmentUrl;
    message.attachmentType = this.getAttachmentType(attachmentUrl);
    return this.messageRepository.save(message);
  }

  private getAttachmentType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (imageExtensions.includes(extension || '')) {
      return 'IMAGE';
    }
    return 'FILE';
  }
}

