/**
 *user model
 */

const mongoose 		= require('mongoose');
const userSchema 	= require('../../app/database/schema').user;
const user 			= mongoose.model('User', userSchema);

module.exports = user;