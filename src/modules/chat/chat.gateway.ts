import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  @SubscribeMessage('join_room')
  handleJoinRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.roomId);
    return { event: 'joined_room', data: { roomId: data.roomId } };
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.leave(data.roomId);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { roomId: string; content: string; type?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = (client.handshake.auth as any)?.userId || (client.data as any)?.userId;
    const message = await this.chatService.createMessage({
      roomId: data.roomId,
      senderId,
      content: data.content,
    });
    this.server.to(data.roomId).emit('new_message', { message });
    return message;
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client.handshake.auth as any)?.userId;
    client.to(data.roomId).emit('user_typing', { userId, roomId: data.roomId });
  }
}
