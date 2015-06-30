var fs = require('fs');
var childProcess = require('child_process');
var SelectionEngine = require('./selectionEngine/engine');
var filepathConvert = require('./filepath-convert');

function DJ(path) {
    var timout;
    var songBuffer = 3000;
    this.path = path;
    this.startTimestamp = 0;
    this.curSong;
    this.events = {}    // name, callbacks
    this.selector = new SelectionEngine(fs.readdirSync(this.path));

    this.registerEvent('next_song');

    // represent songs as a connected graph
    // weight the graph according to suggestions
    // traversal has entropy, which determines how much the dj can go 'upstream'

    function findDuration(path, callback) {
        childProcess.exec('ffmpeg -i ' + path, function(error, stdout, stderr) {
            var durString = (stdout + stderr).split('Duration: ')[1].split(', start: ')[0];
            var durStringArr = durString.split('.')[0].split(':');
            durStringArr.push(durString.split('.')[1].substring(0, 2));

            callback(parseInt(durStringArr[0]) * 360 * 1000 +
                    parseInt(durStringArr[1]) * 60 * 1000 +
                    parseInt(durStringArr[2]) * 1000 +
                    parseInt(durStringArr[3]));
        })
    }

    this.rateSelection = function(rating) {    // 1 : positive, 0 : negative
        this.selector.rateSelection(rating);
    }
    this.startNextTrack = function(callback) {
        var curDJ = this;
        fs.readdir(curDJ.path, function(err, files) {
            // for now, just return random
            // eventually convert this into an LRU cache
            var file = curDJ.selector.selectFrom(curDJ.curSong);
            console.log('selected file: ' + file);

            findDuration(curDJ.path + filepathConvert.convertTo(file), function(duration) {

                // duration needs to be adjusted to playback speed of Audio API player
                clearTimeout(timout);
                timout = setTimeout(function() {
                    curDJ.startNextTrack(function() {});
                }, duration + songBuffer);

                curDJ.startTimestamp = Date.now();
                curDJ.curSong = file;
                console.log(curDJ.curSong);
                curDJ.dispatchEvent('next_song');

                callback(curDJ.curSong);
            })
        })
    }
}
DJ.prototype.registerEvent = function(eventName) {
    this.events[eventName] = []  // callbacks are empty
}
DJ.prototype.addEventListener = function(eventName, callback) {
    if (!this.events[eventName]) { return;}
    this.events[eventName].push(callback);
    // console.log('listener added at index: ' + this.events[eventName].indexOf(callback));
    // console.log('total number of event handlers: ' + this.events[eventName].length);
}
DJ.prototype.removeEventListener = function(eventName, callback) {

    if (!callback || this.events[eventName].indexOf(callback) == -1) {
        // console.log('callback not found for removal');
        return;
    }

    // console.log('removing callback at index: ' + this.events[eventName].indexOf(callback));

    if (this.events[eventName].length >= 2) {
        console.log(this.events[eventName][0] == this.events[eventName][1]);
    }

    this.events[eventName].splice(this.events[eventName].indexOf(callback), 1);
}
DJ.prototype.dispatchEvent = function(eventName, eventArgs) {
    if (!this.events[eventName]) { return;}
    this.events[eventName].forEach(function(callback) {
        callback(eventArgs);
    })
}

module.exports = DJ;