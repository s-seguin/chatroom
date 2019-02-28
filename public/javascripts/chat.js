$(function () {
    let chatLogUpToDate = false;
    var socket = io();

    var userName = document.cookie.replace(/(?:(?:^|.*;\s*)userInfo\s*\=\s*([^;]*).*$)|^.*$/, "$1");

    //document.getElementById("greetingHeader").innerText = "Hello " + userName;
    $('#greetingHeader').text("Hello " + userName);

    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading
        socket.emit('chat message', $('#messageBox').val(), userName);
        $('#messageBox').val('');
        return false;
    });

    socket.on('chat message', function(msg, time, user) {
        if (user == userName)
            $('#messageList').append($('<li>').text(time + "  " + user + ": " + msg ).addClass("myMessage"));
        else
            $('#messageList').append($('<li>').text(time + "  " + user + ": " + msg ));
    });

    socket.on('chat log', function (log) {
        if (!chatLogUpToDate) {
            for (let entry in log) {
                if (log[entry].user == userName)
                    $('#messageList').append($('<li>').text(log[entry].time + " " + log[entry].user + ": " + log[entry].msg ).addClass("myMessage"));
                else
                    $('#messageList').append($('<li>').text(log[entry].time + " " + log[entry].user + ": " + log[entry].msg ));
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
            $('#userList').append($('<li>').text(userList[name]));
        }
        
    });
});

