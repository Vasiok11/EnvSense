const socketIo = require('socket.io');

let io;

module.exports = {
    init: (httpServer) => {
        io = socketIo(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        io.on('connection', (socket) => {
            console.log(`[WebSocket] Frontend client connected: ${socket.id}`);
            
            socket.on('disconnect', () => {
                console.log(`[WebSocket] Frontend client disconnected: ${socket.id}`);
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io is not initialized!');
        }
        return io;
    }
};