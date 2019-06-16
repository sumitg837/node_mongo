/**
 *track_email schema (for tracking email feed by driver/user in engaging ad)
 */

const mongoose 	= require('mongoose');
let Schema 		= mongoose.Schema;

let track_emailSchema = new Schema({
	driver_id 			 : String,
	advertisement_id	 : String,
	email 				 : String,
	date 				 : Date
});

module.exports = track_emailSchema;