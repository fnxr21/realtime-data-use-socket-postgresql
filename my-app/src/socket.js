import { io } from "socket.io-client";

// const SocketURL = import.meta.env.VITE_APP_SOCKET_URL;
// const URL = import.meta.NODE_STATUS_ENV === 'production' ? undefined : SocketURL;
const URL = import.meta.env.VITE_APP_SOCKET_URL;
export const socket = io(URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
  timeout: 20000,
});
// Function to connect

export function connectSocket() {
  // Optionally pass authentication before connect
  //   const token = localStorage.getItem("serviceToken");
  //   if (token) {
  //   socket.auth = { token: token };
  //   }
  //   if (!socket.connected) {
  socket.connect();
  //   }
  return true;
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}
