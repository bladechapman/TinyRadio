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
    $('#search').on('keyup', function() {
        console.log($('#search').val());
        if ($('#search').val().length === 0) {
            $('.list').empty();
        }
        else {
            filtered_songs = filterSongs($('#search').val());
            $('.list').empty();
            filtered_songs.forEach(function(songname, index) {
                $('.list').append('<div index="' + index + '">' + window.filter_filename(songname) + '</div>');
            });
        }
    });
    $('.list').click(function(event) {
        console.log(event.target.attributes['index'].value);
        var index = event.target.attributes['index'].value;

        console.log(filtered_songs[index]);
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