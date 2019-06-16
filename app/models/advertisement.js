/**
 *Advertisement model
 */

const mongoose 				= require('mongoose');
const advertisementSchema	= require('../../app/database/schema').advertisement;
const advertisement 		= mongoose.model('Advertisement', advertisementSchema);

module.exports = advertisement;