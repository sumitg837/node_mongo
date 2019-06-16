/**
 *ad_assign schema (details of assigned ad to driver)
 */

const mongoose 	= require('mongoose');
let Schema 		= mongoose.Schema;

let ad_assignSchema = new Schema({
	driver_id 			: String,
	advertisement_id	: String,
	assign_time 		: Date,
	deassign_time 		: Date
});

module.exports = ad_assignSchema;