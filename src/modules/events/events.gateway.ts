import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join:distributor')
  handleJoinDistributor(@MessageBody() distributorId: string, @ConnectedSocket() client: Socket) {
    client.join(`distributor:${distributorId}`);
  }

  @SubscribeMessage('join:client')
  handleJoinClient(@MessageBody() clientId: string, @ConnectedSocket() client: Socket) {
    client.join(`client:${clientId}`);
  }

  @SubscribeMessage('join:driver')
  handleJoinDriver(@MessageBody() driverId: string, @ConnectedSocket() client: Socket) {
    client.join(`driver:${driverId}`);
  }

  emitToDistributor(distributorId: string, event: string, data: any) {
    this.server.to(`distributor:${distributorId}`).emit(event, data);
  }

  emitToClient(clientId: string, event: string, data: any) {
    this.server.to(`client:${clientId}`).emit(event, data);
  }

  emitToDriver(driverId: string, event: string, data: any) {
    this.server.to(`driver:${driverId}`).emit(event, data);
  }
}
