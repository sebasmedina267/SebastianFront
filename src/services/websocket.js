let ws = null;
let listeners = [];

export function initWebSocket() {
  ws = new WebSocket('wss://back.daseja.systems/ws');

  ws.onopen = () => {
    console.log('WebSocket conectado');
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // Notificar a todos los listeners registrados
    listeners.forEach((cb) => cb(data));
  };

  ws.onclose = () => {
    console.log('WebSocket desconectado');
  };

  ws.onerror = (err) => {
    console.error('Error en WebSocket:', err);
  };
}

export function sendWS(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.warn('WebSocket no está listo para enviar mensajes');
  }
}

// Permite que cualquier componente escuche mensajes del WS
export function onWSMessage(callback) {
  listeners.push(callback);

  // Devuelve función para desuscribirse
  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
}
