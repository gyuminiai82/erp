"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

const WebSocketContext = createContext<{
  activeSessions: number;
  systemMetrics: any;
}>({ activeSessions: 0, systemMetrics: null });

export const useWebSocket = () => useContext(WebSocketContext);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [activeSessions, setActiveSessions] = useState(0);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;
    let isUnmounted = false;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`);
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'active_sessions') {
            setActiveSessions(data.count);
          } else if (data.type === 'system_metrics') {
            setSystemMetrics(data.data);
          }
        } catch (e) {
          console.error("WS message error", e);
        }
      };

      ws.onclose = () => {
        if (!isUnmounted) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ activeSessions, systemMetrics }}>
      {children}
    </WebSocketContext.Provider>
  );
}
