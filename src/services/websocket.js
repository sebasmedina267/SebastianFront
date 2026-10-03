import { API_BASE_URL } from '../api.js';

let socket = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
let shouldReconnect = false;
let status = 'disconnected';
const messageListeners = new Set();
const statusListeners = new Set();

const notifyStatus = (nextStatus) => {
  status = nextStatus;
  statusListeners.forEach((listener) => listener(status));
};

const getWebSocketUrl = () => {
  const configuredUrl = import.meta.env.VITE_WS_URL || API_BASE_URL;
  const url = new URL(configuredUrl, window.location.href);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws';
  url.search = '';
  url.hash = '';
  return url.toString();
};

const connect = () => {
  if (!shouldReconnect || (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING))) {
    return;
  }

  notifyStatus('connecting');
  const currentSocket = new WebSocket(getWebSocketUrl());
  socket = currentSocket;

  currentSocket.onopen = () => {
    reconnectAttempts = 0;
    notifyStatus('connected');
  };

  currentSocket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      messageListeners.forEach((listener) => {
        try {
          listener(message);
        } catch (error) {
          console.error('Error procesando evento WebSocket:', error);
        }
      });
    } catch (error) {
      console.error('Mensaje WebSocket JSON inválido:', error);
    }
  };

  currentSocket.onerror = (error) => {
    console.error('Error en WebSocket:', error);
  };

  currentSocket.onclose = () => {
    if (socket === currentSocket) {
      socket = null;
    }

    if (!shouldReconnect) {
      notifyStatus('disconnected');
      return;
    }

    notifyStatus('reconnecting');
    const delay = Math.min(1000 * (2 ** reconnectAttempts), 15000);
    reconnectAttempts += 1;
    reconnectTimer = window.setTimeout(connect, delay);
  };
};

export function initWebSocket() {
  shouldReconnect = true;
  window.clearTimeout(reconnectTimer);
  connect();

  return () => {
    shouldReconnect = false;
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;

    if (socket) {
      const currentSocket = socket;
      socket = null;
      currentSocket.close();
    }

    notifyStatus('disconnected');
  };
}

export function sendWS(message) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
    return true;
  }

  return false;
}

export function onWSMessage(callback) {
  messageListeners.add(callback);
  return () => messageListeners.delete(callback);
}

export function onWSStatus(callback) {
  statusListeners.add(callback);
  callback(status);
  return () => statusListeners.delete(callback);
}
