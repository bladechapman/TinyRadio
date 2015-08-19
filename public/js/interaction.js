$(function() {
    var songs = [];
    var filtered_songs = [];
    var songsReq = new XMLHttpRequest();
    songsReq.open('GET', '/songs', true);
    songsReq.responseType = 'json';
    songsReq.send();
    songsReq.onreadystatechange = function() {
        if (songsReq.readyState == 4 && songsReq.status == 200) {
            songs = songsReq.response.data;
        }
    }

    function filterSongs(sub) {
        ret = []
        songs.forEach(function(title) {
            if (title.toLowerCase().indexOf(sub.toLowerCase()) !== -1) {
                ret.push(title);
            }
        });
        return ret;
    }
    var empty_interval;
    $('#search').on('keyup', function() {
        if ($('#search').val().length === 0) {
            $('.list').removeClass('expanded');
            empty_interval = setTimeout(function() {
                $('.list').empty();
                console.log('EMPTY');
                empty_interval = null;
            }, 200);
        }
        else {
            if (empty_interval) {
                clearInterval(empty_interval);
            }
            filtered_songs = filterSongs($('#search').val());
            $('.list').empty();
            filtered_songs.forEach(function(songname, index) {
                $('.list').append('<div class="list_item" index="' + index + '">' + window.filter_filename(songname) + '</div>');
            });
            $('.list').addClass('expanded');
        }
    });
    $('.list').click(function(event) {
        var index = event.target.attributes['index'].value;
        $.ajax({
            type: 'POST',
            url: '/enqueue',
            data: {
                'name': filtered_songs[index]
            },
            success: function() {
                console.log('SUCCESS');
            },
            error: function() {
                console.log('ERROR');
            }
        })
    });
    $('.secondary').hover(function() {
        $('.stations').addClass('expanded');
    }, function() {
        $('.stations').removeClass('expanded');
    });

    // $('.up_button').click(function() {
    //     console.log('VOTED UP!');
    //     $.ajax({
    //         type: 'POST',
    //         url: '/vote',
    //         data: {
    //             'vote' : 1,
    //         },
    //         success: function() {
    //             console.log('Success');
    //         },
    //         error: function(err) {
    //             console.log(err)
    //         }
    //     })

    //     $('.menu_wrapper').fadeTo(50, 0, function() {
    //         $('.menu_wrapper').hide();
    //     });
    // })
    // $('.down_button').click(function() {
    //     console.log('VOTED DOWN');
    //     $.ajax({
    //         type: 'POST',
    //         url: '/vote',
    //         data: {
    //             'vote' : 0,
    //         },
    //         success: function() {
    //             console.log('success');
    //         },
    //         error: function(err) {
    //             console.log(err)
    //         }
    //     })
    //     $('.menu_wrapper').fadeTo(50, 0, function() {
    //         $('.menu_wrapper').hide();
    //     });
    // })
});