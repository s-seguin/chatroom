$(function () {
    var socket = io();
    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading
        socket.emit('chat message', $('#messageBox').val(), "user");
        $('#messageBox').val('');
        return false;
    });

    socket.on('chat message', function(msg, date, user){
        console.log("rcvd : "+ msg);
        $('#messageList').append($('<li>').text(user +": " + msg +" on " + date));
    });
});