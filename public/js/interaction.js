$(function() {
    var songs = [];
    var filtered_songs = [];
    var expanded = false;
    var $search = $('#search');
    var $list = $('.list');
    var $circle = $('.circle');

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
                var interval = setTimeout(removeAnimation, animation_duration);
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
        var ret = [];
        songs.forEach(function(title) {
            if (title.toLowerCase().indexOf(sub.toLowerCase()) !== -1) {
                ret.push(title);
            }
        });
        return ret;
    }
    (function initData(callback) {
        callback = callback || function(){};

        var songsReq = new XMLHttpRequest();
        songsReq.open('GET', '/songs', true);
        songsReq.responseType = 'json';
        songsReq.send();
        songsReq.onreadystatechange = function() {
            if (songsReq.readyState == 4 && songsReq.status == 200) {
                songs = songsReq.response.data;
                callback();
            }
        };
        window.app_socket.on('songlist_change', function() {
            initData(updateList);
        });
    })();
    function updateList() {
        if ($search.val().length === 0) {
            if (expanded) {
                expandAll();
            } else {
                collapseList();
            }
        }
        else {
            expandFilter();
        }
    }
    $circle.click(function() {
        if (expanded) {
            $circle.removeClass('collapsed');
            expanded = false;
            updateList();
        } else {
            $circle.addClass('collapsed');
            expanded = true;
            if ($search.val().length === 0) {
                expandAll();
            } else {
                expandFilter();
            }
        }
    });

    function collapseList() {
        $list.removeClass('expanded');
    }
    function expandAll() {
        $list.empty();
        $list.addClass('expanded');
        songs.forEach(function(songname, index) {
            $('.list').append('<div class="list_item" index="' + index + '">' + window.filterFilename(songname) + '</div>');
        });
    }
    function expandFilter() {
        $list.empty();
        $list.addClass('expanded');
        filtered_songs = filterSongs($search.val());
        filtered_songs.forEach(function(songname, index) {
            $('.list').append('<div class="list_item" index="' + index + '">' + window.filterFilename(songname) + '</div>');
        });
    }

    $search.on('keyup', updateList);
    $list.click(function(event) {
        if (!event.target.attributes['index']) { return; }
        var index = event.target.attributes['index'].value;
        $('#search').focus();

        var songName = (expanded && $search.val().length === 0) ? songs[index] : filtered_songs[index];

        $.ajax({
            type: 'POST',
            url: '/enqueue',
            data: {
                'name': songName
            },
            success: function() {
                flashAnimation(event.target, 'success');
            },
            error: function() {
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