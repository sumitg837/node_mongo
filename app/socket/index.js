'use strict';

var config = require('../config');
var redis = require('redis').createClient;
var adapter = require('socket.io-redis');

var Room = require('../models/room');
/*
encapsulate all event emittings and listening
*/
var ioEvents = function(io){
	//chat
	// Chatroom namespace
	io.sockets.on('connection', function(socket) {
		console.log('msg connected');
		socket.on('clientMessage', function(content){
			console.log('clientMessage'+content);
			socket.emit('newMessage',content);
			socket.broadcast.emit('serverMessage', username + ' said: ' +content);
		});
		// When a socket exits
		socket.on('disconnect', function() {

			// Check if user exists in the session
			if(socket.request.session.passport == null){
				return;
			}

			// Find the room to which the socket is connected to, 
			// and remove the current user + socket from this room
			Room.removeUser(socket, function(err, room, userId, cuntUserInRoom){
				if(err) throw err;

				// Leave the room channel
				socket.leave(room.id);

				// Return the user id ONLY if the user was connected to the current room using one socket
				// The user id will be then used to remove the user from users list on chatroom page
				if(cuntUserInRoom === 1){
					socket.broadcast.to(room.id).emit('removeUser', userId);
				}
			});
		});

		// When a new message arrives
		socket.on('newMessage', function(content) {

			// No need to emit 'addMessage' to the current socket
			// As the new message will be added manually in 'main.js' file
			// socket.emit('addMessage', message);
			
			socket.broadcast.emit('addMessage', message);
		});
		socket.on('addMessage',function(message){
			console.log(appHtml.helpers.addMessage(message));
		});
	});
}

var appHtml= {
	helpers :{
		encodeHTML: function(str){
			return $('<div />').text(str).html();
		},
		// Adding a new message to chat history
    addMessage: function(message){
      message.date      = (new Date(message.date)).toLocaleString();
      message.username  = this.encodeHTML(message.email);
      message.content   = this.encodeHTML(message.content);

      var html = `<li>
                    <div class="message-data">
                      <span class="message-data-name">${message.email}</span>
                      <span class="message-data-time">${message.text}</span>
                    </div>
                    <div class="message my-message" dir="auto">${message.content}</div>
                  </li>`;

                  return html;
      // $(html).hide().appendTo('.chat-history ul').slideDown(200);

      // // Keep scroll bar down
      // $(".chat-history").animate({ scrollTop: $('.chat-history')[0].scrollHeight}, 1000);
    }
	}
}
/*

I also have the same problem, first I tried to restart redis-server by sudo service restart but the problem still remained. Then I removed redis-server by sudo apt-get purge redis-server and install it again by sudo apt-get install redis-server and then the redis was working again.
 It also worth to have a look at redis log which located in here /var/log/redis/redis-server.log

Download the redis64-latest.zip native 64bit Windows port of redis
wget https://raw.github.com/ServiceStack/redis-windows/master/downloads/redis64-latest.zip

Extract redis64-latest.zip in any folder, e.g. in c:\redis
Run the redis-server.exe using the local configuration
cd c:\redis

redis-server.exe redis.conf

Run redis-cli.exe to connect to your redis instance
cd c:\redis

redis-cli.exe
*/
var init = function(app){
	console.log('Initiated Server..');
	var server = require('http').Server(app);
	var io = require('socket.io').listen(server, {origins:'localhost:* http://localhost:* http://www.localhost:*'});
	io.set('transports', ['websocket']);
	//Use Redis
	let port = config.redis.port;
	let host = config.redis.host;
	let pubClient = redis(port, host);
	let subClient = redis(port, host);
	io.adapter(adapter({pubClient, subClient}));

	//allow socket to use session data
	// io.use((socket, next)=>{
	// 	require('../session')(socket.request, {}, next);
	// });

	// define all Events
	ioEvents(io);
	console.log('Server Is Starting..');
	// return server object to list all the port number
	
	return server;
}

module.exports =  init;
