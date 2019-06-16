var Mysql = require('mysql');
var config = require('../config');
var async = require('async');

var PRODUCTION_DB = 'sumit'
  , TEST_DB = '';

exports.MODE_TEST = 'mode_test'
exports.MODE_PRODUCTION = 'mode_production';

var state = {
  pool: null,
  mode: null,
}
//database : mode === exports.MODE_PRODUCTION ? PRODUCTION_DB : TEST_DB
var connect = function(mode, done) {
  state.pool = Mysql.createPool({
  	connectionLimit : 10,
    host : config.db.host,
	user : config.db.username,
	password : config.db.password,
	database :'sumit'
  })
  state.mode = mode
  done();
}

var getPool = function() {
  return state.pool;
}

var executeQuery = function(query, param, callback){
 var pool = state.pool;
 if (!pool) return done(new Error('Missing database connection.'))

    pool.getConnection(function(err,connection){
        if (err) {
          connection.release();
          throw err;
        } 
        connection.query(query, param, function(err,rows){
            
            if(!err) {
                callback(null, {rows: rows});
            }else{
            	throw err;
            	connection.release();
            }          
        });
        connection.on('error', function(err) {      
              throw err;
          	  connection.release();
              return;     
        });
        return connection;
    });
}

exports.fixtures = function(data) {
  var pool = state.pool
  if (!pool) return done(new Error('Missing database connection.'))

  var names = Object.keys(data.tables)
  async.each(names, function(name, cb) {
    async.each(data.tables[name], function(row, cb) {
      var keys = Object.keys(row)
        , values = keys.map(function(key) { return "'" + row[key] + "'" })

      pool.query('INSERT INTO ' + name + ' (' + keys.join(',') + ') VALUES (' + values.join(',') + ')', cb)
    }, cb)
  }, done)
}

exports.drop = function(tables, done) {
  var pool = state.pool
  if (!pool) return done(new Error('Missing database connection.'))

  async.each(tables, function(name, cb) {
    pool.query('DELETE * FROM ' + name, cb)
  }, done)
}
// var mysqls = Mysql.createConnection({
// 	host : config.db.host,
// 	user : config.db.username,
// 	password : config.db.password,
// 	database : config.db.dbname
// },function(err){
// 	if(err) throw err;
// 	console.log('connect');
// });
// var userSchema = mysqls.extend({
// 	tableName : 'users',
// });
// var roomSchema = mysqls.extend({
// 	tableName : 'rooms',
// });
// // mysqls.connect(function(error){
// // 	if(error) throw error;
// // 	console.log('connected');
// // });

module.exports = {connect, getPool, executeQuery
	// models :{
	// 	user : require('./schema/user.js'),
	// 	room : require('./schema/room.js')
	// }
};
// module.exports.connection = connection;