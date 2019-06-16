/**
 *advertisement schema
 **/

const mongoose 		= require('mongoose');
let Schema 			=mongoose.Schema;

let advertisementSchema = new Schema({
	name 		: String,
	type 		: String,
	duration 	: Number,
	link 		: String,
	create 		: Date,
	modify 		: Date 
});

module.exports = advertisementSchema;