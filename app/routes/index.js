'use strict';

var app = require('express');
var router = app.Router();
var db = require('../database');

// Home page

router.get('/', function(req, res, next) {
	// If user is already logged in, then redirect to rooms page
	//res.sendFile(process.cwd()+ '/app/views/index.html');
	res.render('login');
});
router.post('/join', function(req,res,next){
	var email = req.body.email;
	console.log('join' +email);
	var sts=false;
	var id=0;
  var values = [email, new Date().toISOString()];
  var returnData = '';
  db.executeQuery('SELECT COUNT(*) AS idCount FROM users WHERE email = ?', email, function(err, data, feild){
  	if(err) throw err;
  	var numRows = data.rows[0].idCount;
  	console.log(JSON.stringify(data)+''+numRows);
  	if(numRows == 0){
  		sts=true;
  console.log(sts);
  	}
  	console.log(sts);
  });
  //SELECT val FROM big_table where val = someval ORDER BY id DESC LIMIT n;
  if(sts == true){
	db.executeQuery('INSERT INTO users (email, date) VALUES(?, ?)', values, function(err,data){
		if(err) throw err;
		console.log(data +'+'+data.insertId);
		res.send({data});
		//returnData.email =email;
	});
	}else{
		db.executeQuery('SELECT * FROM data ORDER By id DESC LIMIT 20', null, function(err,data){
			if(err) throw err;
			console.log(data[0].row.id);
			for (var i = 0; i < data.length; i++) {
			console.log(data);
			}
			res.send({data});
		});
	}
});
router.post('/message', function(req,res,next){
	var text = req.body.text;
	var email =req.body.email;
	console.log(email+'message' +text);
	var values = [email, text, new Date().toISOString()];
	db.executeQuery('INSERT INTO data (email, text, date) VALUES(?, ?, ?)', values, function(err,data){
		if(err) throw err;
		console.log(data);
		//res.redirect('/chat');
	});
	var now = new Date();
        res.send({user: email, content: text, date: new Date().toISOString()});
        //res.render('clientMessage', {email: email, content: text });
});
// router.get('/rooms', [User.isAuthenticated, function(req, res, next) {
// 	Room.find(function(err, rooms){
// 		if(err) throw err;
// 		res.render('rooms', { rooms });
// 	});
// }]);

module.exports = router;