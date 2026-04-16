import { io } from "socket.io-client";

const socket = io("https://code-interview-plateform-backend.onrender.com", {
    transports: ["websocket"],
});

export default socket;