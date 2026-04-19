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
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  @SubscribeMessage('join-room')
  handleJoinRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.roomId);
    return { event: 'joined-room', data: { roomId: data.roomId } };
  }

  @SubscribeMessage('send-message')
  async handleMessage(@MessageBody() data: { roomId: string; senderId: string; content: string }) {
    const message = await this.chatService.createMessage(data);
    this.server.to(data.roomId).emit('new-message', message);
    return message;
  }
}
