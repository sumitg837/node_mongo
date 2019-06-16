/**
 *Driver Schema
 */
 const mongoose		=require('mongoose');
 let Schema 		=mongoose.Schema;

 let driverSchema = new Schema({
 	name 		: String,
 	driver_id 	: String,
 	email 		: String,
 	status		: String,
 	tablet1_udid: String,
 	tablet2_udid: String,
 	creates		: Date,
 	modify		: Date

 });

 module.exports = driverSchema;