$(function () {
    //Cache JQuery Selectors
    let $messageList = $('#messageList');
    let $messageBox = $('#messageBox');
    let $greetingHeader = $('#greetingHeader');

    let chatLogUpToDate = false;
    let socket = io();

    let userName = document.cookie.replace(/(?:(?:^|.*;\s*)userName\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    let userColor = document.cookie.replace(/(?:(?:^|.*;\s*)userColor\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    let userID = document.cookie.replace(/(?:(?:^|.*;\s*)userID\s*\=\s*([^;]*).*$)|^.*$/, "$1");

    $greetingHeader.text("Hello " + userName);

    $('form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        let msgVal = $messageBox.val();

        if (msgVal.startsWith("/nickcolor")) {
            let splitMsg = msgVal.split(" ");

            if (splitMsg.length !== 2 || !validHex(splitMsg[1]))
                alert("incorrect command or color");
            else {
                setCookie("userColor", "#" + splitMsg[1], 4);
                userColor = "#" + splitMsg[1];
                $messageBox.val(''); //clear messageBox
            }

        } else if (msgVal.startsWith("/nick")) {
            let splitMsg = msgVal.split(" ");

            if (splitMsg.length !== 2)
                alert("incorrect command.");
            else {
                socket.emit('change username request', splitMsg[1]);
                $messageBox.val(''); //clear messageBox
            }


        } else {
            socket.emit('chat message', $messageBox.val(), userName, userColor);
            $messageBox.val(''); //clear messageBox

        }

        return false;

    });

    socket.on('chat message', function (msg, time, user, color) {

        let message = buildMessage(msg, time, user, color);

        if (user === userName)
            $messageList.append(message.addClass("myMessage"));
        else if (user === "system")
            $messageList.append(message.addClass("systemMessage"));
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

                //this lets us check if we sent the message with an old user name
                if (log[entry].id === userID)
                    $messageList.append(message.addClass("myMessage"));
                else if (log[entry].user === "system")
                    $messageList.append(message.addClass("systemMessage"));
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
                setCookie("userName", newUserName, 4)
                userName = newUserName;
                $greetingHeader.text("Hello " + userName);

                socket.emit('chat message', oldUserName + " changed their name to " + newUserName, "system");
            } else {
                alert("The username " + newUserName + " has already been take. Choose a different one.");
            }
        }
    });

    socket.on('system message', function (user, message) {
        if (userName === user) {
            $messageList.append($('<li>').text(message));
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
    message = "<span id='bubble' class='messageHolder'>" + message + "</span>";
    return $('<li>' + message + '</li>');
}

/***
 * Method to set cookies from modified from W3Schools
 * @param cookieName
 * @param cookieValue
 * @param hoursToLive
 */
function setCookie(cookieName, cookieValue, hoursToLive) {
    let d = new Date();
    d.setTime(d.getTime() + (hoursToLive * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cookieName + "=" + cookieValue + ";" + expires;
}