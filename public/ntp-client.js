(function(root) {
    var offsets = [];
    var socket;
    var ntp = {};

    function sync() {
        socket.emit('ntp:client_ticket', {'client_ping' : Date.now()});
    }

    ntp.init = function(sock, options) {
        options = options || {};
        socket = sock;

        sync();
        setInterval(sync, options.interval || 1000);

        socket.on('ntp:server_ticket', function(data) {
            var expected = ((Date.now() - data.client_ping)/2);
            var actual = (Date.now() - data.server_ping);

            var offset = actual - expected;
            offsets.unshift(offset);

            if (offsets.length > (options.buffer || 10)) {
                offsets.pop();
            }
        })
    }

    ntp.offset = function() {
        var offset_sum = 0;
        for (var i = 0; i < offsets.length; i++) {
            offset_sum += offsets[i];
        }

        return (offset_sum/(offsets.length || 1));
    }


    root.ntp = ntp;
})(window);