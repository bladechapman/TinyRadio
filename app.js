var express = require('express');
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var dj_generator = require('./dj');

var dj = new dj_generator('sound/');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http)


app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

(function startDJ(){
    dj.startNextTrack(function() {});

    dj.addEventListener('next_song', function() {
        io.emit('next_song');
    })
})();

(function initEndpoints() {
    io.on('connection', function(socket) {
        socket.emit('connection')

        socket.on('disconnect', function() {
        })
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

http.listen(8000, function() {
    console.log('listening on port 8000');
})