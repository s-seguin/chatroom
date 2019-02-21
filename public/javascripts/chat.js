$(function () {
    var socket = io();
    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading
        socket.emit('chat message', $('#messageBox').val());
        $('#messageBox').val('');
        return false;
    });

    socket.on('chat message', function(msg){
        console.log("rcvd : "+ msg);
        $('#messageList').append($('<li>').text(msg));
    });
});