import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL || "https://triangle-lab-chat-production.up.railway.app/", {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

export default socket;