/**
 *track_engaging schema (for tracking no of click on a engaging advertisement)
 */

const mongoose 			= require('mongoose');
let Schema 				= mongoose.Schema;

let track_engaging_adSchema = new Schema({
	driver_id 			: String,
	advertisement_id 	: String,
	no_of_click 		: Number
});

module.exports = track_engaging_adSchema;