'use strict';

var session = require('express-session');
var config = require('../config');

var init = function(){
	return session({
		secret : config.sessionSecret,
		resave : false,
		saveUninitialized : true
	});
}

module.exports = init;