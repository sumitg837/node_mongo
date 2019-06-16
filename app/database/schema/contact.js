/**
 *contact schema
 */

const mongoose 			= require('mongoose');
let Schema 				= mongoose.Schema;

let contactSchema = new Schema({
	name 			: String,
	mobile 			: Number,
	email 			: String,
	subject 		: String,
	query 			: String,
	read			: String, 
	create 			: Date

});

module.exports = contactSchema;