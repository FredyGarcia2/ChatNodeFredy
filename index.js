const express = require('express');
const socket = require('socket.io');

const app = express();
const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, function() {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Servir la carpeta pública
app.use(express.static('public'));

// Configurar Socket.io
const io = socket(server, {
    maxHttpBufferSize: 1e8 // Permite transferir archivos de hasta ~100MB
});

io.on('connection', function(socketClient) {
    console.log('Nueva conexión establecida:', socketClient.id);

    // Evento de mensaje (texto o archivo)
    socketClient.on('chat', function(data) {
        io.sockets.emit('chat', data);
    });

    // Evento de "escribiendo..."
    socketClient.on('typing', function(data) {
        socketClient.broadcast.emit('typing', data);
    });
});
