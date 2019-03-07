var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');

const uuidv4 = require('uuid/v4');

var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

//create server
var http = require('http').Server(app);

//listen on port 3000
http.listen(3000, function () {
    console.log('listening on *:3000');
});

//Socket io stuff
var io = require('socket.io').listen(http);

let chatLog = []; //a history of the chat log kept in memory
let userList = []; //
const POTENTIAL_USERNAMES = ["steve", "alice", "joe", "panther", "tiger", "falcon", "zebra"];

let sendSysMsg = false;
let newUserNameToMsg = "";
let sysMsg = "";

//Basic routing
app.get('/', function (req, res) {

    let userName = req.cookies.userName;  //grab the user cookie (just the username)
    let userID = req.cookies.userID;


    //if it hasn't been defined this is a new user
    if (userName === undefined || userID === undefined) {
        let newUser = createNewUser();

        console.log("Cookie unset, setting to " + newUser.name);
        console.log("userName " + userName);
        console.log("UserID" + userID);

        res.cookie('userName', newUser.name, {maxAge: 4 * 60 * 60 * 1000});
        res.cookie('userID', newUser.id, {maxAge: 12 * 60 * 60 * 1000});
        res.cookie('userColor', "#000000", {maxAge: 4 * 60 * 60 * 1000});

    } else {
        if (userExistsInUserList(userName)) {
            let dupUsers = userList.filter(user => user.name === userName);
            if (dupUsers.length > 1)
                console.log("ERROR: we have more than one " + userName + " in our userList.");
            else {
                if (dupUsers[0].id !== userID) {
                    console.log(userName + "It looks like someone took your old user name");

                    let newUserName = createNewUser().name;
                    res.cookie('userName', newUserName, {maxAge: 4 * 60 * 60 * 1000});

                    newUserNameToMsg = newUserName;
                    sendSysMsg = true;
                    sysMsg = userName + " It looks like someone took your old user name. You are now called: " + newUserNameToMsg;

                } else
                    console.log("Welcome back " + userName);
            }
        }

    }

    res.sendFile(__dirname + '/index.html');
});

//handle the socket.io stuff
io.on('connection', function (socket) {
    io.emit('chat log', chatLog); //broadcast the chatLog to everyone since someone new joined
    let user = getUserNameFromSocketCookie(socket);
    let id = getUserIDFromSocketCookie(socket);

    if (userExistsInUserList(user))
        console.log(user + " needs a new user name");
    else
        addUserToUserList(user, id);

    io.emit('user list', userList.map(user => user.name)); //broadcast the userList on new connection or disconnect

    //did someone steal the username? if yes let them know
    if (sendSysMsg && newUserNameToMsg === user) {
        io.emit('system message', user, sysMsg);
        sendSysMsg = false;
        newUserNameToMsg = "";
        sysMsg = "";
    }

    /**
     * Someone disconnected
     */
    socket.on('disconnect', function () {
        console.log(user + ' disconnected');
        removeUserFromUserList(user);

        io.emit('user list', userList.map(user => user.name));

    });

    /**
     * Someone send a chat message, broadcast it to all other users with the current time
     */
    socket.on('chat message', function (msg, usr, color) {
        let time = new Date().toLocaleTimeString();
        msg = sanitizeUserString(msg);
        if (usr === "system")
            chatLog.push({"user": usr, "id": "system", "time": time, "msg": msg, "color": color});
        else
            chatLog.push({"user": usr, "id": id, "time": time, "msg": msg, "color": color});

        io.emit('chat message', msg, time, usr, color);
    });

    socket.on('change username request', function (newUserName) {
        newUserName = sanitizeUserString(newUserName);
        if (!userExistsInUserList(newUserName)) {
            removeUserFromUserList(user);
            addUserToUserList(newUserName, id);

            io.emit('username change', user, newUserName, "accepted");
            io.emit('user list', userList.map(u => u.name));
            user = newUserName; //set this socket.user to the new name

        } else {
            io.emit('username change', user, newUserName, "denied");
        }
    });

});

/**
 * Add userName to the userList if it doesnt already exist on there
 * @param userName
 */
function addUserToUserList(userName, id) {
    //console.log("User to Add() name: " + userName + " id: " +id);
    if (!userExistsInUserList(userName))
        userList.push({"name": userName, "id": id});
    // console.log(userList);
}

/**
 * Remove userName from userList
 * @param userName
 */
function removeUserFromUserList(userName) {
    userList = userList.filter(user => user.name !== userName);
    // console.log(userList);
}

function userExistsInUserList(userName) {
    let filteredList = userList.filter(user => user.name == userName);
    //console.log("Filtered list: " + filteredList);
    if (filteredList.length >= 1)
        return true;
    else
        return false;
}

/**
 * Parse the cookies in the socket for the userName cookie
 * @param {socket} socket
 */
function getUserNameFromSocketCookie(socket) {
    let cookie = socket.request.headers.cookie;
    return cookie.replace(/(?:(?:^|.*;\s*)userName\s*\=\s*([^;]*).*$)|^.*$/, "$1"); //parse the userName from the userName cookie
}

function getUserIDFromSocketCookie(socket) {
    let cookie = socket.request.headers.cookie;
    return cookie.replace(/(?:(?:^|.*;\s*)userID\s*\=\s*([^;]*).*$)|^.*$/, "$1"); //parse the userName from the userName cookie
}


/**
 * Create a new unique username that doesnt exist in userList
 * @returns {array} the user name we created
 */
function createNewUser() {
    let userName = userList.length < POTENTIAL_USERNAMES.length
        ? POTENTIAL_USERNAMES[userList.length]
        : POTENTIAL_USERNAMES[Math.floor(Math.random() * 7)] + "_" + Math.floor(Math.random() * 100);

    let count = 0;
    //check and see if the username exists
    while (userExistsInUserList(userName) && count <= 7) {
        userName = POTENTIAL_USERNAMES[Math.floor(Math.random() * 7)] + "_" + Math.floor(Math.random() * 100);
        count++;

        if (count >= 7)
            userName = userName + "_" + count;
    }
    let id = uuidv4();
    return {"name": userName, "id": id};
}

/***
 * Sanitize user provide strings
 *
 * From http://shebang.brandonmintern.com/foolproof-html-escaping-in-javascript/
 * @param unsafeStr
 * @returns {string}
 */
function sanitizeUserString(unsafeStr) {
    return unsafeStr
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/\'/g, '&#39;'); // '&apos;' is not valid HTML 4
}