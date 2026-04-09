import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (poolId) => {
  const [data, setData] = useState(null);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const logError = (...args) => {
    if (import.meta.env.DEV) {
      console.error(...args);
    }
  };

  const connect = () => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    ws.current = new WebSocket(`${wsUrl}/ws/${poolId}`);

    ws.current.onopen = () => {};

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'new_reading') {
        setData(message);
      }
    };

    ws.current.onclose = () => {
      reconnectTimeout.current = setTimeout(connect, 3000); // Exponential backoff
    };

    ws.current.onerror = (error) => {
      logError('WebSocket error:', error);
    };
  };

  useEffect(() => {
    if (poolId) {
      connect();
    }

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [poolId]);

  return data;
};
