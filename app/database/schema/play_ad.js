/**
 *Play-Ad Schema
 */


const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let play_adSchema = new Schema({
	driver_id : String,
	advertisement_id : String,
	play_date : Date,
	play_time : Number,
	play_end_time : Number
});

module.exports = play_adSchema;