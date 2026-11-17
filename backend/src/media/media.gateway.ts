import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MediaGateway {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  notifyMediaReady(mediaId: string, media: any) {
    this.eventEmitter.emit('media:ready', { mediaId, media });
  }

  notifyMediaFailed(mediaId: string, error: string) {
    this.eventEmitter.emit('media:failed', { mediaId, error });
  }

  notifyFoldersUpdated() {
    this.eventEmitter.emit('folders:updated');
  }
}
