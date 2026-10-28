import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
export const connectSocket = (accessToken: string): Socket => {
    if(socket?.connected) {
        return socket;
    }
    if(socket) {
        socket.disconnect();
    }
    socket = io(import.meta.env.VITE_API_URL, {
        auth: {
            token: accessToken
        },
        withCredentials: true,
        reconnection: true
    });
    socket.on("connect_error", (error) => {
        console.error("Socket connection failed:", error.message);
    });
    return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
    socket?.disconnect();
    socket = null;
};