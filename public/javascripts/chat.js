$(function () {
    let chatLogUpToDate = false;
    var socket = io();

    var userName = document.cookie.replace(/(?:(?:^|.*;\s*)userInfo\s*\=\s*([^;]*).*$)|^.*$/, "$1");

    //document.getElementById("greetingHeader").innerText = "Hello " + userName;
    $('#greetingHeader').text("Hello " + userName);

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

    socket.on('chat log', function (log) {
        if (!chatLogUpToDate) {
            for (let entry in log) {
                console.log(log[entry]);
                $('#messageList').append($('<li>').text(log[entry].user + ": " + log[entry].msg + " on " + log[entry].date));
            }
            chatLogUpToDate = true;
        } else {
            console.log("We've already imported the chat log.");
        }
    });

    socket.on('user list', function (userList) {
        console.log(userName + " joined my chat!");
        $('#userList').empty();
        for (let name in userList) {
            console.log(userList[name]);
            $('#userList').append($('<li>').text(userList[name]));
        }
        
    });
});