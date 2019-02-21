var express = require('express');
var path = require('path');

var app = express();
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Creating the server and listening on the port
 */
var http = require('http').Server(app);

http.listen(3000, function(){
  console.log('listening on *:3000');
});


/**
 * Basic routing since its a single page app
 */
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

/**
 * Socket IO stuff
 */
var io = require('socket.io').listen(http);

io.on('connection', function(socket){
  socket.broadcast.emit('I connected');

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
    //console.log(msg);
  });

});

