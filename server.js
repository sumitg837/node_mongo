//express
const express 	= require('express');
const session 	= require('express-session');
const flash 	= require('express-flash');
const fileupload= require('express-fileupload');
const MemoryStore = require('memorystore')(session)
// var livereload  = require("connect-livereload");
//basic
const cors 		= require('cors');
const bodyParser= require('body-parser');
const path 	 	= require('path');
const fs 		= require('fs-extra');
//file upload
const multer	= require('multer');
const formidable= require('formidable');

//check node_env, set it. currently set to 'development'
const env 		= require('./app/config').env;
var config 		= require('./app/config')[env];

//database configration
const db 		= require('./app/config/database');
const model 	= require('./app/models');
const userSeeder= require('./app/database/seeder');

//app configration
const app 		= express();


//configration of view engine
app.engine('ejs', require('express-ejs-extend'));
app.set('views', __dirname +'/app/view');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use('/assets', express.static(__dirname + '/assets'));
// var store = new session.MemoryStore;
//session
app.use(session({
	secret : 'hestabit ad_app ',
	cookie : { maxAge : 600000 },
	resave : false,
	rolling : true,
	saveUninitialized : true,
	store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
}));

//custom flash middleware --
var allowCrossDomain = function(req, res, next) {
    if ('OPTIONS' == req.method) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
      res.send(200);
    }
    else {
      next();
    }
};

app.use(allowCrossDomain);
app.use(function(req, res, next){
	/*
	*if there's a flash message in session request, make it available in response, then delete
	*/
	res.locals.sessionFlash = req.session.sessionFlash;
	delete req.session.sessionFlash;
	next();
});

app.use(flash());

//seeder
userSeeder(app);
//app.disable('etag');
app.set('env', env);

//Error handling
app.use(function(err, req, res, next){
	if(err){
		console.log('error:app1');
		throw err;
	}
		res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	//render the error page

	res.status(err.status || 500);
	//res.render('error', {error: res.locals.error });
	process.on('uncaugthException', function(error){
		console.log('error:app2'+error.stack);
	});

});
//running the app
app.listen(config.EnvPort.port, function(){
	//console.log(app);
	console.log(`http://localhost:${config.EnvPort.port}`);
});
module.exports = app;

// all route matches go the routes.js file
const router = require('./router');
