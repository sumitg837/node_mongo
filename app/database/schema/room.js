var path = require('path');
// var updater = require( path.resolve( __dirname, "./updater.js" ) );
var mysql = require(path.resolve(__dirname,'../'));

var roomSchema = mysql.roomSchema;

module.exports = roomSchema;

