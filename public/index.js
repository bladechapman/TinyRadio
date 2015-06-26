window.AudioContext = window.AudioContext || window.webkitAudioContext;

(function() {
    var context = new AudioContext();
    var socket = io();
    var source;
    var serverOffset; // server timestamp

    ntp.init(socket, {
        interval : 333,
        buffer: 5
    });
    socket.on('app:connection', function() {
        loadSound();
    })
    socket.on('app:next_song', function() {
        loadSound();
    })

    function async(limit, async_finally) {
        var internalCounter = 0;
        var internalLimit = limit;

        return function() {
            internalCounter++;
            if (internalCounter == internalLimit) {
                async_finally();
            }
        }
    }

    function process(data, info) {
        source = context.createBufferSource()
        context.decodeAudioData(data, function(decoded) {
            source.buffer = decoded;
            source.connect(context.destination);    // connect to whatever is rendering the audio (speakers)

            // positive ntp indicates client is ahead of server
            var requestTime = (Date.now() - ntp.offset()) - info.servTimestamp;
            var songTime = info.servTimestamp - info.songTimestamp;

            var elapsedTime = (requestTime + songTime) / 1000;

            console.log('requestTime in milliseconds: ' + requestTime);
            source.start(context.currentTime, elapsedTime);
        })
    }

    function loadSound() {
        if (source) {
            source.stop();
        }

        var infoReq = new XMLHttpRequest();
        infoReq.open('GET', '/info', true);
        infoReq.responseType = 'json';

        var songReq = new XMLHttpRequest();
        songReq.open('GET', '/song', true);
        songReq.responseType = 'arraybuffer';

        infoReq.send();
        songReq.send();

        var data;
        var info;
        var asyncNetwork = async(2, function() {
            process(data, infoReq.response);
        })

        songReq.onload = function() {
            data = songReq.response;
            asyncNetwork();
        }

        infoReq.onreadystatechange = function() {
            if (infoReq.readyState == 4 && infoReq.status == 200) {
                info = infoReq.response;
                asyncNetwork();
            }
        }
    }
})();