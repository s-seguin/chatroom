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
    //Create a user cookie so that we can keep track of userList
    let userCookie = req.cookies.userInfo;
    if (userCookie === undefined) {
        let userName = createNewUser();
        console.log("Cookie unset, setting to " + userName);
        res.cookie('userInfo', userName, {maxAge: 4 * 60 * 60 * 1000});

    } else {
       console.log("Welcome back " + userCookie);
       if (userList.indexOf(userCookie) == -1) {
           userList.push(userCookie);
       } else {
           console.log("There already appears to be a " + userCookie + " in the user list")
       }
    }


    res.sendFile(__dirname + '/index.html');

});

io.on('connection', function(socket){
    io.emit('chat log', chatLog); //broadcast the chatLog to everyone since someone new joined

    addUserToUserList(getUserNameFromSocketCookie(socket));
    io.emit('user list', userList); //broadcast the userList on new connection or disconnect

    socket.on('disconnect', function(){
        console.log(getUserNameFromSocketCookie(socket) + ' disconnected');
        removeUserFromUserList(getUserNameFromSocketCookie(socket));
        
        io.emit('user list', userList);

    });

    socket.on('chat message', function(msg, usr){
        let time = new Date().toLocaleTimeString();
        io.emit('chat message', msg, time, usr);
        chatLog.push({"user": usr, "time": time, "msg": msg});
    });

});

function addUserToUserList(userName) {
    if (userList.indexOf(userName) == -1)
        userList.push(userName);
}

function removeUserFromUserList(userName) {
    let index = userList.indexOf(userName);
    if (index > -1)
        userList.splice(index, 1);
        
}

/**
 * Parse the cookies in the socket for the userinfo cookie
 * @param {socket} socket 
 */
function getUserNameFromSocketCookie(socket) {
    let cookie = socket.request.headers.cookie;
    return cookie.replace(/(?:(?:^|.*;\s*)userInfo\s*\=\s*([^;]*).*$)|^.*$/, "$1"); //parse the userName from the userInfo cookie
}



function createNewUser() {
    let userName = "";

    if (userList.length > POTENTIAL_USERNAMES.length)
        userName = POTENTIAL_USERNAMES[Math.floor(Math.random()*7)] + "_" + Math.floor(Math.random() * 100);
    else
        userName = POTENTIAL_USERNAMES[userList.length];

    //if the username already exists in the list
    if (userList.indexOf(userName) != -1)
        console.log("Duplicate userList in userList list");

    userList.push(userName);

    return userName;
}
