import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MediaGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  afterInit(server: Server) {
    console.log('WebSocket Gateway inicializado para mídias');
  }

  notifyMediaReady(mediaId: string, media: any) {
    this.server.emit('media:ready', { mediaId, media });
  }

  notifyMediaFailed(mediaId: string, error: string) {
    this.server.emit('media:failed', { mediaId, error });
  }
}
