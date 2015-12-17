exports.sync = function(socket) {
    if (socket.listeners('ntp:client_ticket') > 0) {
        return;
    }

    socket.on('ntp:client_ticket', function(data) {
        socket.emit('ntp:server_ticket', {
            'server_ping' : Date.now(),
            'client_ping' : data.client_ping
        });
    });
};