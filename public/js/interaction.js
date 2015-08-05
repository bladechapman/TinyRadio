$(function() {
    $('.up_button').click(function() {
        console.log('VOTED UP!');
        $.ajax({
            type: 'POST',
            url: '/vote',
            data: {
                'vote' : 1,
            },
            success: function() {
                console.log('Success');
            },
            error: function(err) {
                console.log(err)
            }
        })

        $('.menu_wrapper').fadeTo(50, 0, function() {
            $('.menu_wrapper').hide();
        });
    })
    $('.down_button').click(function() {
        console.log('VOTED DOWN');
        $.ajax({
            type: 'POST',
            url: '/vote',
            data: {
                'vote' : 0,
            },
            success: function() {
                console.log('success');
            },
            error: function(err) {
                console.log(err)
            }
        })
        $('.menu_wrapper').fadeTo(50, 0, function() {
            $('.menu_wrapper').hide();
        });
    })
});