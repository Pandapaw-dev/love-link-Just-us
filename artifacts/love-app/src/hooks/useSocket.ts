import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

let sharedSocket: Socket | null = null;
let refCount = 0;

export function useSocket(enabled: boolean) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (!sharedSocket) {
      sharedSocket = io({
        path: "/socket.io",
        withCredentials: true,
        transports: ["websocket", "polling"],
      });
    }
    refCount++;
    socketRef.current = sharedSocket;

    return () => {
      refCount--;
      if (refCount <= 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        refCount = 0;
      }
    };
  }, [enabled]);

  return socketRef;
}
