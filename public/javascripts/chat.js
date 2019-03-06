$(function () {
    //Cache JQuery Selectors
    let messageList = $('#messageList');
    let messageBox = $('#messageBox');

    let chatLogUpToDate = false;
    var socket = io();

    var userName = document.cookie.replace(/(?:(?:^|.*;\s*)userInfo\s*\=\s*([^;]*).*$)|^.*$/, "$1");

    $('#greetingHeader').text("Hello " + userName);

    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading

        let msgVal = messageBox.val();

        if (msgVal.startsWith("/nickcolor")) {
            console.log("change color");
        } else if (msgVal.startsWith("/nick")) {
            console.log("change usrname");
            //let splitMsg = msgVal.split(/\S+/g);
            let splitMsg = msgVal.split(" ");

            if (splitMsg.length != 2)
                alert("incorrect command.");
            else {
                socket.emit('change username', userName, splitMsg[1]);
            }


        } else {
            socket.emit('chat message', messageBox.val(), userName);
        }

        messageBox.val(''); //clear messageBox
        return false;

    });

    socket.on('chat message', function(msg, time, user) {
        if (user == userName)
            messageList.append($('<li>').text(time + "  " + user + ": " + msg).addClass("myMessage"));
        else
            messageList.append($('<li>').text(time + "  " + user + ": " + msg));

        //scroll to bottom of messages
        messageList.scrollTop(messageList[0].scrollHeight);
    });

    socket.on('chat log', function (log) {
        if (!chatLogUpToDate) {
            for (let entry in log) {
                if (log[entry].user == userName)
                    messageList.append($('<li>').text(log[entry].time + " " + log[entry].user + ": " + log[entry].msg).addClass("myMessage"));
                else
                    messageList.append($('<li>').text(log[entry].time + " " + log[entry].user + ": " + log[entry].msg));
            }
            chatLogUpToDate = true;

            //scroll to bottom of messages
            messageList.scrollTop(messageList[0].scrollHeight);

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

    socket.on('username change', function (oldUserName, newUserName, result) {
        //is this for us?
        console.log(oldUserName + " " + newUserName + " " + result);
        if (oldUserName == userName) {
            console.log("yes its me");
            if (result == "accepted") {
                document.cookie = "userInfo=" + newUserName;
                userName = newUserName;
                $('#greetingHeader').text("Hello " + userName);

            } else {
                alert("The username " + newUserName + " has already been take. Choose a different one.");
            }
        }
    });
});

