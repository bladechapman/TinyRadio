var express = require('express');
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var DJ = require('./tools/dj');

var dj = new DJ('sound/');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ntp = require('./tools/ntp-server');


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

    app.get('/err', function(req, res) {
        var undef = undefined;
        var err = undef.udef_attr;
        res.json({
            'message' : '[ERROR]'
        })
    })

    app.get('/skip', function(req, res) {
        dj.startNextTrack()
        res.json({
            'message' : '[SUCCESS]'
        })
    })

    app.post('/vote', function(req, res) {
        if (req.body.vote === undefined || (req.body.vote != 1 && req.body.vote != 0)) {
            res.json({
                'message' : '[ERROR] invalid vote value',
            })
            return;
        }

        dj.selector.rateSelection(req.body.vote);
        res.json({'message' : '[SUCCESS]'})
    })

    app.get('/info', function(req, res) {
        res.json({
            songTimestamp : dj.startTimestamp,
            servTimestamp : Date.now(),
            file : dj.curSong
        });
    })
    app.get('/song', function(req, res) {
        res.set({'Content-Type': 'audio/mpeg'});
        var readStream = fs.createReadStream("sound/" + dj.curSong);
        readStream.pipe(res);
    })
})();

function gracefulExit() {
    console.log('exiting gracefully');
    dj.selector.saveMetadata();
    process.exit();
}
function logError(err) {
    console.log('HEY HEY HEY');
    var date = '[' + new Date() + ']\n';
    fs.writeFileSync('./err_log.txt', date + err);
    process.exit();
}
process.on('SIGTERM', gracefulExit);
process.on('SIGINT', gracefulExit);
process.on('uncaughtException', logError);
process.on('TypeError', logError);

http.listen(8000, function() {
    console.log('listening on port 8000');
})