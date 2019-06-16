/**
 *	imei schema
 */

const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let imeiSChema = new Schema({
	imei : String,
	config : Number,
	create : Date
});

module.exports = imeiSChema;