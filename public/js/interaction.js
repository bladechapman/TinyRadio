$(function() {
    var songs = [];
    var filtered_songs = [];

    var flashAnimation = (function flashAnimationGenerator() {
        var intervals = {};
        var animation_duration = 500;
        return function(element, classname) {
            if (intervals[element]) {
                intervals[element]();    // remove the current animation
            }

            $(element).addClass(classname);
            window.requestAnimationFrame(function() {
                $(element).addClass('animate');
                $(element).removeClass(classname);

                // circular dependency is resolved by the async nature of removeAnimation
                interval = setTimeout(removeAnimation, animation_duration);
                function removeAnimation() {
                    $(element).removeClass('animate');
                    intervals[element] = null;
                    clearInterval(interval);
                }
                intervals[element] = removeAnimation;
            })
        }
    })();
    function filterSongs(sub) {
        var ret = []
        songs.forEach(function(title) {
            if (title.toLowerCase().indexOf(sub.toLowerCase()) !== -1) {
                ret.push(title);
            }
        });
        return ret;
    }
    (function initData() {
        var songsReq = new XMLHttpRequest();
        songsReq.open('GET', '/songs', true);
        songsReq.responseType = 'json';
        songsReq.send();
        songsReq.onreadystatechange = function() {
            if (songsReq.readyState == 4 && songsReq.status == 200) {
                songs = songsReq.response.data;
            }
        }
    })();
    $('#search').on('keyup', function() {
        if ($('#search').val().length === 0) {
            $('.list').removeClass('expanded');
        }
        else {
            $('.list').empty();
            $('.list').addClass('expanded');
            filtered_songs = filterSongs($('#search').val());
            filtered_songs.forEach(function(songname, index) {
                $('.list').append('<div class="list_item" index="' + index + '">' + window.filterFilename(songname) + '</div>');
            });
        }
    });
    $('.list').click(function(event) {
        var index = event.target.attributes['index'].value;
        $('#search').focus();

        $.ajax({
            type: 'POST',
            url: '/enqueue',
            data: {
                'name': filtered_songs[index]
            },
            success: function() {
                flashAnimation(event.target, 'success');
            },
            error: function(err) {
                flashAnimation(event.target, 'failure');
            }
        });
    });
    $('.secondary').hover(function() {
        $('.stations').addClass('expanded');
    }, function() {
        $('.stations').removeClass('expanded');
    });
});