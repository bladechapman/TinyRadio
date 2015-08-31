var fs = require('fs');
var childProcess = require('child_process');
var recursiveReaddirSync = require('recursive-readdir-sync');
var chok = require('chokidar');
var Selector = require('./engine');


/**
TEST
**/

function DJ(path) {
    var cur_dj = this;
    var timout;
    var songBuffer = 3000;
    var type_whitelist = {
        'mp4': true,
        'm4a': true,
        'mp3': true,
        'wav': true
    };
    this.path = path;
    this.startTimestamp = 0;
    this.events = {}    // name, callbacks
    this.selector = new Selector(filterDirectory(this.path), undefined, this.path);

    this.registerEvent('next_song');

    // watcher = chok.watch(path, {
    //     'persistent': true,
    //     'usePolling': false
    // });
    // watcher.on('ready', function(event, path) {
    //     watcher.on('all', function(event, path) {;
    //         if (event === 'unlink') {
    //             cur_dj.selector.removeNode(path);
    //         }
    //         else if (event === 'add') {
    //             cur_dj.selector.addNode(path);
    //         }
    //         else if (event === 'addDir') {
    //             files = recursiveReaddirSync(path);
    //             files.forEach(function(element) {
    //                 cur_dj.selector.addNode(element);
    //             });
    //         }
    //     });
    // });
    // watcher.on('error', function(error) {
    //     console.log('Error watching files');
    //     console.log(err);
    //     console.log('exiting gracefully');
    //     cur_dj.selector.saveMetadata();
    //     process.exit();
    // });

    function filterDirectory(path) {
        var files = [];
        var ret = [];

        try {
            var stats = fs.lstatSync(path);
            if (stats.isDirectory()) { files = recursiveReaddirSync(path); }
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
            var path_components = element.split('.');
            if(fs.lstatSync(element).isFile() && path_components[path_components.length - 1] in type_whitelist) {
                ret.push(element);
            }
        });
        return ret;
    }
    function findDuration(path, callback) {
        childProcess.exec('ffmpeg -i \"' + path + "\"", function(error, stdout, stderr) {
            console.log(stdout + stderr);
            var dur_string = (stdout + stderr).split('Duration: ')[1].split(', start: ')[0];
            var dur_string_arr = dur_string.split('.')[0].split(':');
            dur_string_arr.push(dur_string.split('.')[1].substring(0, 2));

            callback(parseInt(dur_string_arr[0]) * 360 * 1000 +
                    parseInt(dur_string_arr[1]) * 60 * 1000 +
                    parseInt(dur_string_arr[2]) * 1000 +
                    parseInt(dur_string_arr[3]));
        });
    }

    this.startNextTrack = function(callback) {
        callback = callback || function() {};
        // for now, just return random
        // eventually convert this into an LRU cache
        var file = cur_dj.selector.selectNext();

        try {
            findDuration(file, function(duration) {
                clearTimeout(timout);
                timout = setTimeout(function() {
                    cur_dj.startNextTrack(function() {});
                }, duration + songBuffer);

                cur_dj.startTimestamp = Date.now();
                cur_dj.dispatchEvent('next_song');

                callback(file);
            })
        }
        catch(err) {
            console.log('[ERROR] Cannot read file ' + file + ', trying again');
            cur_dj.curSelector.removeNode(file);
            cur_dj.startNextTrack(function() {});
        }
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
    if (!callback || this.events[eventName].indexOf(callback) === -1) { return; }
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


var test_dj = new DJ('./sound');

module.exports = DJ;