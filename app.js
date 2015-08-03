var express = require('express');
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var DJ = require('./tools/dj');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ntp = require('./tools/ntp-server');

var sound_target = './sound/';
var type_index = process.argv.indexOf('-source');
if (type_index !== -1 && process.argv[type_index + 1]) {
    sound_target = process.argv[type_index + 1];
    if (sound_target.charAt(sound_target.length - 1) !== '/') { sound_target += '/'; }
}
var dj = new DJ(sound_target);

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

(function startDJ(){
    dj.startNextTrack();

    dj.addEventListener('next_song', function() {
        io.emit('app:next_song');
    })
})();

(function initEndpoints() {
    io.on('connection', function(socket) {
        ntp.sync(socket);
        setTimeout(function() {
            socket.emit('app:next_song');
        }, 3000);
    })

    app.get('/nodes', function(req, res) {
        res.json({
            'message': '[SUCCESS]',
            'data': dj.selector.getNodes()
        });
    });
    app.get('/skip', function(req, res) {
        dj.startNextTrack()
        res.json({
            'message': '[SUCCESS]'
        })
    });
    app.post('/vote', function(req, res) {
        if (req.body.vote === undefined || (req.body.vote !== '1' && req.body.vote !== '0')) {
            res.status(400).json({
                'message': '[ERROR] invalid vote value',
            })
            return;
        }

        dj.selector.rateSelection(parseInt(req.body.vote));
        res.json({'message' : '[SUCCESS]'})
    });
    app.get('/info', function(req, res) {
        res.json({
            songTimestamp: dj.startTimestamp,
            servTimestamp: Date.now(),
            file: dj.selector.getCurrentFile(),
            prev: dj.selector.getLastFile()
        });
    });
    app.get('/song', function(req, res) {
        res.set({'Content-Type': 'audio/mpeg'});
        var readStream = fs.createReadStream("sound/" + dj.selector.getCurrentFile());
        readStream.pipe(res);
    });
})();

function gracefulExit() {
    console.log('exiting gracefully');
    dj.selector.saveMetadata();
    process.exit();
}
process.on('SIGTERM', gracefulExit);
process.on('SIGINT', gracefulExit);

http.listen(8000, function() {
    console.log('listening on port 8000');
});