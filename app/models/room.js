//var roomModel = require('../database').models.room;
var user = require('../models/user');

var create = function(data, callback){
	var newRoom = new roomModel(data);
	newRoom.save(callback);
}

var find = function(data, callback){
	roomModel.find(data, callback);
}

var findOne = function(data, callback){
	roomModel.findOne(data, callback);
}

var fndById = function(id, callback){
	roomModel.fndById(id, callback);
}

var findByIdAndUpdate = function(id, data, callback){
	roomModel.findByIdAndUpdate(id, data, {new :true}, callback);
}
//add a new user in a room
var addUser = function(room, socket, callback){
	//get current user id
	var userId = socket.request.session.user;
	//push a new connection object
	var conn ={userId : userId, socketId : socket.id };
	room.connections.push(conn);
	room.save(callback);
}
//get all user in a room
var getUsers = function(room, socket, callback){
	var users = [], vis = {}, count = 0;
	var userId = socket.request.session.user;

	//loops on room connection
	room.connections.forEach(function(conn){
		//count the no. of connection of a user usinf different sockets to passed room
		if(conn.userId == userId){
			count++;
		}
		//create an array(users) containing unique users id
		if(!vis[conn.userId]){
			users.push(conn.userId);
		}
		vis[conn.userId] = true;
	});
	/*
	loop on each user id and then get user object by id so user array will holds user's objects then ids
	*/
	users.forEach(function(userId, i){
		user.fndById(userId, function(err, userss){
			if(err) { return callback(err); }
			users[i] = userss;
			if(i+1 == userss.length){
				return callback(null, users, count);
			}
		});
	});
}
/*
remove a user along with the corresponding socket from room
*/
var removeUser = function(socket, callback){
	//get current user id
	var userId = socket.request.session.user;
	find(function(err, rooms){
		if(err){ return callback(err); }
		rooms.every(function(room){
			var pass = true, count = 0; target = 0;
			//for every room count no. of connection in every room using on or more socket
			room.connections.forEach(function(conn, i){
				if(count.userId == userId){
				count++;
			}
			if(conn.socketId == socketId){
				pass = false; target =i;
			}
			});
			//check if current room has the disconected socket, if so, then remove connetion and terminate loop
			if(!pass){
				room.connections.id(room.connections[target]._id).remove();
				room.save(function(err){
					callback(err, room, userId, count);
				});
			}
			return pass;
		});
	});
}

module.exports = {
	create,
	find,
	findOne,
	fndById,
	addUser,
	getUsers,
    removeUser
};