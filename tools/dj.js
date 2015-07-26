var fs = require('fs');
var childProcess = require('child_process');
var Selector = require('./engine');
var filepathConvert = require('./filepath-convert');

function DJ(path) {
    var timout;
    var songBuffer = 3000;
    this.path = path;
    this.startTimestamp = 0;
    this.curSong;
    this.events = {}    // name, callbacks
    this.selector = new Selector(filterDirectory(this.path));

    this.registerEvent('next_song');

    // represent songs as a connected graph
    // weight the graph according to suggestions
    // traversal has entropy, which determines how much the dj can go 'upstream'

    function filterDirectory(path) {
        var files = [];
        var ret = [];

        try {
            var stats = fs.lstatSync(path);
            if (stats.isDirectory()) { files = fs.readdirSync(path); }
            else { except(); }
        }
        catch (err) { except(); }
        function except() {
            console.log("Looks like you don't have any sounds. Try adding some to " + path);
            try { fs.mkdirSync(path); }
            catch(err) { console.log("Could not create " + path + ". This directory may already exist, but with no sounds."); }
            process.exit();
        }

        if (files.length === 0) { except(); }
        files.forEach(function(element) {
            var convertedPath = path + element;
            if(fs.statSync(convertedPath).isFile()) {
                ret.push(element);
            }
        });
        return ret;
    }
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

    this.startNextTrack = function(callback) {
        var curDJ = this;
        callback = callback || function() {};
        fs.readdir(curDJ.path, function(err, files) {
            // for now, just return random
            // eventually convert this into an LRU cache
            var file = curDJ.selector.selectFrom(curDJ.curSong);

            try {
                findDuration(curDJ.path + filepathConvert.convertTo(file), function(duration) {
                    // duration needs to be adjusted to playback speed of Audio API player
                    console.log('Selected file: ' + file);

                    clearTimeout(timout);
                    timout = setTimeout(function() {
                        curDJ.startNextTrack(function() {});
                    }, duration + songBuffer);

                    curDJ.startTimestamp = Date.now();
                    curDJ.curSong = file;
                    curDJ.dispatchEvent('next_song');

                    callback(curDJ.curSong);
                })
            }
            catch(err) {
                console.log('[ERROR] Cannot read file ' + file + ', trying again');
                curDJ.startNextTrack(function() {});
            }
        })
    }
}
DJ.prototype.registerEvent = function(eventName) {
    this.events[eventName] = []  // callbacks are empty
}
DJ.prototype.addEventListener = function(eventName, callback) {
    if (!this.events[eventName]) { return; }
    this.events[eventName].push(callback);
}
DJ.prototype.removeEventListener = function(eventName, callback) {
    if (!callback || this.events[eventName].indexOf(callback) == -1) { return; }
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