/**
 *ad_assign model
 */

const mongoose 			= require('mongoose');
const ad_assignSchema 	= require('../../app/database/schema').ad_assign;
const ad_assign 		= mongoose.model('Ad_assign', ad_assignSchema);

module.exports = ad_assign;