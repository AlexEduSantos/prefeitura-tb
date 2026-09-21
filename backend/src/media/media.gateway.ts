import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class MediaGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  afterInit(server: Server) {
    console.log('WebSocket Gateway inicializado para mídias');
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    client.emit('pong', data);
  }

  notifyMediaReady(mediaId: string, media: any) {
    this.server.emit('media:ready', { mediaId, media });
  }

  notifyMediaFailed(mediaId: string, error: string) {
    this.server.emit('media:failed', { mediaId, error });
  }

  notifyFoldersUpdated() {
    this.server.emit('folders:updated');
  }
}
