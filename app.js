var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');

var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

//create server
var http = require('http').Server(app);

//listen on port 3000
http.listen(3000, function(){
    console.log('listening on *:3000');
});

//Socket io stuff
var io = require('socket.io').listen(http);

let chatLog = []; //a history of the chat log kept in memory
let userList = []; //
const POTENTIAL_USERNAMES = ["steve", "alice", "joe", "panther", "tiger", "falcon", "zebra"];

//Basic routing
app.get('/', function(req, res){

    let userCookie = req.cookies.userInfo;  //grab the user cookie (just the username)

    //if it hasn't been defined this is a new user
    if (userCookie === undefined) {
        let userName = createNewUserName();
        addUserToUserList(userName);

        console.log("Cookie unset, setting to " + userName);
        res.cookie('userInfo', userName, {maxAge: 4 * 60 * 60 * 1000});

    } else {
        console.log("Welcome back " + userCookie);
        addUserToUserList(userCookie);
    }

    res.sendFile(__dirname + '/index.html');
});

//handle the socket.io stuff
io.on('connection', function(socket){
    io.emit('chat log', chatLog); //broadcast the chatLog to everyone since someone new joined

    addUserToUserList(getUserNameFromSocketCookie(socket));
    io.emit('user list', userList); //broadcast the userList on new connection or disconnect

    /**
     * Someone disconnected
     */
    socket.on('disconnect', function(){
        console.log(getUserNameFromSocketCookie(socket) + ' disconnected');
        removeUserFromUserList(getUserNameFromSocketCookie(socket));

        io.emit('user list', userList);

    });

    /**
     * Someone send a chat message, broadcast it to all other users with the current time
     */
    socket.on('chat message', function(msg, usr){
        let time = new Date().toLocaleTimeString();
        io.emit('chat message', msg, time, usr);
        chatLog.push({"user": usr, "time": time, "msg": msg});
    });

    socket.on('change username', function (oldUserName, newUserName) {
        console.log("request to change username. Old: " + oldUserName + " new: " + newUserName);
        if (!userExistsInUserList(newUserName)) {
            removeUserFromUserList(oldUserName);
            addUserToUserList(newUserName);
            console.log("accepted");

            io.emit('username change', oldUserName, newUserName, "accepted");
            io.emit('user list', userList);
        } else {
            io.emit('username change', oldUserName, newUserName, "denied");
            console.log("denied");
        }
    });

});

/**
 * Add userName to the userList if it doesnt already exist on there
 * @param userName
 */
function addUserToUserList(userName) {
    if (userList.indexOf(userName) == -1)
        userList.push(userName);
}

/**
 * Remove userName from userList
 * @param userName
 */
function removeUserFromUserList(userName) {
    let index = userList.indexOf(userName);
    if (index > -1)
        userList.splice(index, 1);
}

function userExistsInUserList(userName) {
    if (userList.indexOf(userName) == -1)
        return false;
    else
        return true;
}

/**
 * Parse the cookies in the socket for the userinfo cookie
 * @param {socket} socket 
 */
function getUserNameFromSocketCookie(socket) {
    let cookie = socket.request.headers.cookie;
    return cookie.replace(/(?:(?:^|.*;\s*)userInfo\s*\=\s*([^;]*).*$)|^.*$/, "$1"); //parse the userName from the userInfo cookie
}


/**
 * Create a new unique username that doesnt exist in userList
 * @returns {string} the user name we created
 */
function createNewUserName() {
    //let userName = POTENTIAL_USERNAMES[userList.length];
    let userName = userList.length < POTENTIAL_USERNAMES.length
        ? POTENTIAL_USERNAMES[userList.length]
        : POTENTIAL_USERNAMES[Math.floor(Math.random() * 7)] + "_" + Math.floor(Math.random() * 100);

    let count = 0;
    //check and see if the username exists
    while (userList.indexOf(userName) != -1 && count <= 7) {
        userName = POTENTIAL_USERNAMES[Math.floor(Math.random() * 7)] + "_" + Math.floor(Math.random() * 100);
        count++;

        if (count >= 7)
            userName = userName + "_" + count;
    }

    return userName;
}
