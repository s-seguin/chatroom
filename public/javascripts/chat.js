$(function () {
    //Cache JQuery Selectors
    let $messageList = $('#messageList');
    let $messageBox = $('#messageBox');
    let $greetingHeader = $('#greetingHeader');

    let chatLogUpToDate = false;
    var socket = io();

    var userName = document.cookie.replace(/(?:(?:^|.*;\s*)userName\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    var userColor = document.cookie.replace(/(?:(?:^|.*;\s*)userColor\s*\=\s*([^;]*).*$)|^.*$/, "$1");

    $greetingHeader.text("Hello " + userName);

    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading
        let msgVal = $messageBox.val();

        if (msgVal.startsWith("/nickcolor")) {
            let splitMsg = msgVal.split(" ");

            if (splitMsg.length !== 2 && !validHex(splitMsg[1]))
                alert("incorrect command or color");
            else {
                document.cookie = "userColor=" + "#" + splitMsg[1];
                userColor = "#" + splitMsg[1];
            }

        } else if (msgVal.startsWith("/nick")) {
            let splitMsg = msgVal.split(" ");

            if (splitMsg.length !== 2)
                alert("incorrect command.");
            else
                socket.emit('change username', userName, splitMsg[1]);


        } else {
            socket.emit('chat message', $messageBox.val(), userName, userColor);
        }

        $messageBox.val(''); //clear messageBox
        return false;

    });

    socket.on('chat message', function (msg, time, user, color) {

        let message = buildMessage(msg, time, user, color);

        if (user === userName)
            $messageList.append(message.addClass("myMessage"));
        else
            $messageList.append(message);

        //scroll to bottom of messages
        $messageList.scrollTop($messageList[0].scrollHeight);
    });

    socket.on('chat log', function (log) {
        if (!chatLogUpToDate) {
            for (let entry in log) {

                let e = log[entry];
                let message = buildMessage(e.msg, e.time, e.user, e.color);

                if (log[entry].user === userName)
                    $messageList.append(message.addClass("myMessage"));
                else
                    $messageList.append(message);
            }
            chatLogUpToDate = true;

            //scroll to bottom of messages
            $messageList.scrollTop($messageList[0].scrollHeight);

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

        if (oldUserName === userName) {

            if (result === "accepted") {
                document.cookie = "userName=" + newUserName;
                userName = newUserName;
                $greetingHeader.text("Hello " + userName);

                //socket.emit('chat message', oldUserName + " changed their name to " +  newUserName, "system");
            } else {
                alert("The username " + newUserName + " has already been take. Choose a different one.");
            }
        }
    });
});

function validHex(rbgStr) {
    let regex = /((^[0-9A-F]{6}$)|(^[0-9A-F]{3}$))/i;

    return regex.test(rbgStr);
}

function buildMessage(msg, time, user, color) {
    let htmlTime = "<span class='time'>" + time + "</span>";
    let htmlUser = "<span style='color: " + color + "'>" + user + "</span>";
    let htmlMsg = "<span>" + msg + "</span>";

    let message = htmlTime + " " + htmlUser + ": " + htmlMsg;
    return $('<li>' + message + '</li>');
}