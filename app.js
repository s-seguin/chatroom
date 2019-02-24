var express = require('express');
var path = require('path');

var app = express();
app.use(express.static(path.join(__dirname, 'public')));

//create server and listen on port 3000
var http = require('http').Server(app);

http.listen(3000, function(){
  console.log('listening on *:3000');
});


//Basic routing
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

//Socket io stuff
var io = require('socket.io').listen(http);

let chatLog = []; //a history of the chat log kept in memory
let activeUsers = [];
let numUsers = 0;

io.on('connection', function(socket){
    io.emit('chat log', chatLog);

    activeUsers.push("randoUser_" + numUsers);
    numUsers++;
    console.log(activeUsers[activeUsers.length - 1] + " joined the chat");

  socket.on('disconnect', function(){
      //console.log('user disconnected');
      numUsers--;
  });

  socket.on('chat message', function(msg, usr){
      let date = Date().toLocaleString();
      io.emit('chat message', msg, date, usr);
      chatLog.push({"user": usr, "date": date, "msg": msg});
      console.log(chatLog);
  });

});

