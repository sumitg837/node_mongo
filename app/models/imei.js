/**
 *Imei model
 */


const mongoose 		= require('mongoose');
const imeiSchema 	= require('../../app/database/schema').imei;
const imei 			= mongoose.model('Imei', imeiSchema);

module.exports = imei;