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

        //prevent user from spamming enter
        if (msgVal !== "") {
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
                socket.emit('chat message', msgVal, userName, userColor);
                $messageBox.val(''); //clear messageBox
            }
        }
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

                //this lets us check if we sent the message with an old user name
                if (log[entry].id === userID)
                    $messageList.append(message.addClass("myMessage"));
                else
                    $messageList.append(message);
            }

            //tell the person who they are
            let m = buildMessage("Welcome, you are " + userName + "!", null, "system", "#000");
            $messageList.append(m);
            chatLogUpToDate = true;

            //scroll to bottom of messages
            $messageList.scrollTop($messageList[0].scrollHeight);

        }
    });

    socket.on('user list', function (userList) {
        $('#userList').empty();
        for (let name in userList) {
            $('#userList').append(buildUserBar(userList[name]));
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
            $messageList.append(buildMessage(message, null, "system", "#000"));
        }
    });
});

/***
 * Checks if hexStr is a valid 3 or 6 digit hex code
 * @param hexStr
 * @returns {boolean}
 */
function validHex(hexStr) {
    let regex = /((^[0-9A-F]{6}$)|(^[0-9A-F]{3}$))/i;

    return regex.test(hexStr);
}

/***
 * Builds the message item applying classes and ids to the different parts for styling upon render
 *
 * @param msg
 * @param time
 * @param user
 * @param color
 * @returns {jQuery|HTMLElement}
 */
function buildMessage(msg, time, user, color) {
    let htmlTime = time !== null ? "<span class='time'>" + time + "</span>" : null;
    let htmlUser = "<span style='color: " + color + "'>" + user + "</span>";
    let htmlMsg = user !== "system" ? "<span class='msg'>" + msg + "</span>" : "<span>" + msg + "</span>";

    let message = "";
    if (user === "system") {
        message = htmlTime === null ? htmlMsg : htmlTime + ": " + htmlMsg;
        message = "<span id='bubble' class='messageHolder systemMessage'>" + message + "</span>";

    } else {
        message = htmlTime + " " + htmlUser + ": " + htmlMsg;
        message = "<div id='bubble' class='messageHolder'>" + message + "</div>";
    }

    return $('<li>' + message + '</li>');
}

function buildUserBar(name) {
    let nameContainer = "<span class='profileName'>" + name + "</span>";
    let bar = "<div class='profileContainer'><img class='profileImg' src='/imgs/activePerson.png' width='50px'/>" + nameContainer + "</div>";
    return $('<li>' + bar + '</li>')
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
