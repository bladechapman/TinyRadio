var express = require('express');
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var DJ = require('./tools/dj');
var app = express();
var apps = require('polo')();
var os = require('os');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ntp = require('./tools/ntp-server');
var sound_target = './sound/';
var source_index = process.argv.indexOf('-source');
var is_private = (process.argv.indexOf('-private') !== -1);
var interfaces = os.networkInterfaces();
var addresses = [];
var port = process.env.PORT || 8000;
var hostname;
var dj;

if (source_index !== -1 && process.argv[source_index + 1]) {
    sound_target = process.argv[source_index + 1];
    if (sound_target.charAt(sound_target.length - 1) !== '/') { sound_target += '/'; }
}
dj = new DJ(sound_target);
for (var i in interfaces) {
    for (var j in interfaces[i]) {
        var address = interfaces[i][j];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
        }
    }
}
hostname = (is_private || !addresses[0]) ? '127.0.0.1' : addresses[0];

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

(function startDJ(){
    dj.startNextTrack();
    dj.addEventListener('next_song', function() {
        io.emit('app:next_song');
        io.emit('queue:resp', dj.selector.getQueue());
    });
})();
(function initEndpoints() {
    io.on('connection', function(socket) {
        ntp.sync(socket);
        socket.emit('stations_changed', {'current': (hostname + ':' + port), 'stations': apps.all('tiny-radio')});
        socket.emit('queue:resp', dj.selector.getQueue());
        setTimeout(function() {
            socket.emit('app:next_song');
        }, 3000);
    });
    app.get('/song', function(req, res) {
        res.set({'Content-Type': 'audio/mpeg'});
        var readStream = fs.createReadStream(dj.selector.getCurrentFile());
        readStream.pipe(res);
    });
    app.get('/songs', function(req, res) {
        res.json({
            'message': '[SUCCESS]',
            'data': Object.keys(dj.selector.getNodes())
        });
    });
    app.post('/enqueue', function(req, res) {
        var status = dj.selector.addToQueue(req.body.name);
        if (status === 1) {
            res.json({'message': '[SUCCESS]'});
            io.emit('queue:resp', dj.selector.getQueue());
        }
        else if (status === -1) {
            res.status(400).json({'message': '[ERROR] - Cannot add ' + req.body.name + ' song to queue'});
        }
        else {
            res.status(400).json({'message': '[ERROR] - The same song cannot be added twice in a row'});
        }
    });
    app.get('/info', function(req, res) {
        res.json({
            songTimestamp: dj.startTimestamp,
            servTimestamp: Date.now(),
            file: dj.selector.getCurrentFile(),
            prev: dj.selector.getLastFile()
        });
    });
})();
(function initExit() {
    process.on('SIGTERM', gracefulExit);
    process.on('SIGINT', gracefulExit);
    function gracefulExit() {
        console.log('exiting gracefully');
        apps.stop();
        dj.selector.saveMetadata();
        process.exit();
    }
})();

http.listen(port, hostname, function() {
    console.log('listening at IP: ' + hostname + ':' + port);

    apps.put({
        'name': 'tiny-radio',
        'port': port,
    });
    apps.on('up', function() {
        io.emit('stations_changed', {'current': (hostname + port), 'stations': apps.all('tiny-radio')});
    });
    apps.on('down', function() {
        io.emit('stations_changed', {'current': (hostname + port), 'stations': apps.all('tiny-radio')});
    });
});