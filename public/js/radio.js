window.AudioContext = window.AudioContext || window.webkitAudioContext;

$(function() {
    var context = new AudioContext();
    var socket = io();
    var source;
    var serverOffset; // server timestamp

    setInterval(loadSound, 60000);

    $('.mobile_activate').click(function() {
        $('.mobile_activate').hide();
        oscillator = context.createOscillator();
        oscillator.connect(context.destination);
        oscillator.start(0);
        oscillator.stop(0.01);

        loadSound();
    });

    ntp.init(socket, {
        interval : 200,
        decay : 0,
        decayLimit : 60000,
        buffer: 20
    });
    socket.on('app:next_song', function() {
        loadSound();
        window.__vis__updateGraph();

        $('.menu_wrapper').show();
        $('.menu_wrapper').fadeTo(50, 1);

        $('.songname').fadeTo(50, 0);
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

    function filter_filename(file) {
        var arr = file.split('.');
        return arr.slice(0, arr.length - 1).join(' ');
    }
    function process(data, info) {
        $('.songname').html(filter_filename(info.file));
        $('.songname').fadeTo(50, 1);

        var temp_source = context.createBufferSource()
        context.decodeAudioData(data, function(decoded) {
            temp_source.buffer = decoded;
            temp_source.connect(context.destination);    // connect to whatever is rendering the audio (speakers)

            // positive ntp indicates client is ahead of server
            var requestTime = (Date.now() - ntp.offset()) - info.servTimestamp;
            var songTime = info.servTimestamp - info.songTimestamp;

            var elapsedTime = (requestTime + songTime) / 1000;

            console.log('ntp offset: ' + ntp.offset());

            temp_source.start(context.currentTime, elapsedTime);

            if (source) { source.stop(0);}
            source = temp_source;
            // source.start(context.currentTime, elapsedTime);
        })
    }

    function loadSound() {
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
            console.log('1');
            asyncNetwork();
        }

        infoReq.onreadystatechange = function() {
            if (infoReq.readyState == 4 && infoReq.status == 200) {
                info = infoReq.response;
                console.log('2');
                asyncNetwork();
            }
        }
    }
});
