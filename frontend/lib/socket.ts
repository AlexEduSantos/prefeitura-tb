// lib/socket.ts — singleton socket.io-client para comunicação com o backend via WebSocket

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

/**
 * Retorna a instância singleton do Socket.io, criando-a se ainda não existir.
 * A conexão só é estabelecida uma vez, reutilizada em toda a aplicação.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Conectado ao servidor:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Desconectado:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Erro de conexão:', err.message);
    });
  }

  return socket;
}

/**
 * Destrói o socket atual (útil para testes ou logout).
 */
export function destroySocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default getSocket;
