window.AudioContext = window.AudioContext || window.webkitAudioContext;

$(function() {
    var context = new AudioContext();
    var socket = io();
    var source;
    var serverOffset; // server timestamp
    var serv_mutex = false;
    setInterval(loadSound, 60000);

    $('.mobile_activate').click(function() {
        oscillator = context.createOscillator();
        oscillator.connect(context.destination);
        oscillator.start(0);
        oscillator.stop(0.01);

        loadSound();
    });
    (function init_io() {
        ntp.init(socket, {
            interval : 333,
            decay : 0,
            decayLimit : 60000,
            buffer: 30
        });
        socket.on('app:next_song', function() {
            loadSound();
        })
        socket.on('stations_changed', function(info) {
            var new_stations = info.stations;
            var current = info.current;

            $('#station_name').html(current);
            new_stations.forEach(function(station_info) {
                $('.stations').append('<div class="list_item"><a href="http://' + station_info.address + '">' + station_info.address + '</div>');
            })
        });
        socket.on('queue:resp', function(queued_songs) {
            $('.two').html(filterFilename(queued_songs[0] || ''));
            $('.three').html(filterFilename(queued_songs[1] || ''))
            $('.four').html(filterFilename(queued_songs[2] || ''));
            $('.five').html(filterFilename(queued_songs[3] || ''))
        });
    })();
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
        var filename = filterFilename(info.file)
        $('.songname').html(filename);
        document.title = "TinyRadio: " + filename;

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
        })
    }
    function loadSound() {
        if (serv_mutex) { return; }
        serv_mutex = true;

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
            serv_mutex = false;
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
    window.filterFilename = function filterFilename(file) {
        var ext_arr = file.split('.');
        var ext = ext_arr.slice(0, ext_arr.length - 1).join();
        var path_arr = ext.split('/');
        var file = path_arr.slice(path_arr.length -1, path_arr.length).join();

        file = file.replace(/\\\s/g, ' ');
        file = file.replace(/\\\(/g, '(');
        file = file.replace(/\\\)/g, ')');
        file = file.replace(/\\\&/g, '&');
        file = file.replace(/\\\'/g, '\'');

        return file;
    }
});
