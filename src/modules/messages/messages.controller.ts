import { Controller, Get, Post, Body, Query, UseGuards, Patch, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get message list' })
  @ApiQuery({ name: 'otherUserId', required: false })
  @ApiOkResponse({ description: 'Message list returned' })
  findAll(@GetUser() user: any, @Query('otherUserId') otherUserId?: string) {
    return this.messagesService.findByUser(user.id, otherUserId);
  }

  @Post()
  @ApiOperation({ summary: 'Send message' })
  @ApiOkResponse({ description: 'Message sent successfully' })
  send(
    @GetUser() user: any,
    @Body() body: { receiverId: string; content: string; bookingId?: string },
  ) {
    return this.messagesService.send(user.id, body.receiverId, body.content, body.bookingId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiOkResponse({ description: 'Message marked as read successfully' })
  markAsRead(@GetUser() user: any, @Param('id') id: string) {
    return this.messagesService.markAsRead(user.id, id);
  }

  // Chat Rooms APIs
  @Get('chat-rooms')
  @ApiOperation({ summary: 'Get chat room list' })
  @ApiOkResponse({ description: 'Chat room list returned' })
  findAllChatRooms(@GetUser() user: any) {
    return this.messagesService.findAllChatRooms(user.id);
  }

  @Get('chat-rooms/:id')
  @ApiOperation({ summary: 'Get chat room details' })
  @ApiParam({ name: 'id', description: 'Chat room ID' })
  @ApiOkResponse({ description: 'Chat room details returned' })
  findOneChatRoom(@GetUser() user: any, @Param('id') id: string) {
    return this.messagesService.findOneChatRoom(id, user.id);
  }

  @Post('chat-rooms')
  @ApiOperation({ summary: 'Create or get chat room' })
  @ApiOkResponse({ description: 'Chat room returned' })
  getOrCreateChatRoom(
    @GetUser() user: any,
    @Body() body: { otherUserId: string; bookingId?: string; auctionId?: string },
  ) {
    return this.messagesService.getOrCreateChatRoom(
      user.id,
      body.otherUserId,
      body.bookingId,
      body.auctionId,
    );
  }

  // Chats API (for compatibility with API spec)
  @Get('chats')
  @ApiOperation({ 
    summary: 'Get chat list',
    description: 'Get chat list. Includes senderId/receiverId of last message for each chat.'
  })
  @ApiOkResponse({ 
    description: 'Chat list returned',
    schema: {
      type: 'object',
      properties: {
        chats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              chatId: { type: 'string', format: 'uuid' },
              participantId: { type: 'string', format: 'uuid', description: 'Other party user ID' },
              participantName: { type: 'string' },
              participantImage: { type: 'string', nullable: true },
              lastMessage: { type: 'string' },
              lastMessageTime: { type: 'string', format: 'date-time' },
              lastMessageSenderId: { type: 'string', format: 'uuid', nullable: true, description: 'Last message sender ID' },
              lastMessageReceiverId: { type: 'string', format: 'uuid', nullable: true, description: 'Last message receiver ID' },
              isLastMessageSentByMe: { type: 'boolean', nullable: true, description: 'Whether last message was sent by current user' },
              unreadCount: { type: 'number' },
              isOnline: { type: 'boolean' },
              transactionId: { type: 'string', format: 'uuid', nullable: true },
            },
          },
        },
      },
    },
  })
  findAllChats(@GetUser() user: any) {
    return this.messagesService.findAllChats(user.id);
  }

  @Get('chats/:chatId/messages')
  @ApiOperation({ 
    summary: 'Get chat messages',
    description: 'Get messages for a chat room. Each message includes senderId and receiverId.'
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ 
    description: 'Chat message list returned',
    schema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              messageId: { type: 'string', format: 'uuid' },
              senderId: { type: 'string', format: 'uuid', description: 'Sender ID' },
              receiverId: { type: 'string', format: 'uuid', description: 'Receiver ID' },
              senderName: { type: 'string' },
              content: { type: 'string' },
              type: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              isRead: { type: 'boolean' },
              isSentByMe: { type: 'boolean', description: 'Whether message was sent by current user' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'number' },
            totalPages: { type: 'number' },
            totalItems: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
      },
    },
  })
  getChatMessages(
    @GetUser() user: any,
    @Param('chatId') chatId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.messagesService.getChatMessages(chatId, user.id, page || 1, limit || 50);
  }

  @Post('chats/:chatId/messages')
  @ApiOperation({ summary: 'Send message (text, file, or image)' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiOkResponse({ description: 'Message sent successfully' })
  sendChatMessage(
    @GetUser() user: any,
    @Param('chatId') chatId: string,
    @Body() body: { content?: string; type?: string; attachmentUrl?: string },
  ) {
    // Determine message type based on attachment
    let messageType = body.type || 'TEXT';
    if (body.attachmentUrl) {
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(body.attachmentUrl);
      messageType = isImage ? 'IMAGE' : 'FILE';
    }

    const content = body.content || (body.attachmentUrl ? 'File attachment' : '');
    return this.messagesService.sendChatMessage(chatId, user.id, content, messageType, body.attachmentUrl);
  }

}
