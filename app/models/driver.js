/*
 *Driver model
 */
const mongoose 		= require('mongoose');
const driverSchema	= require('../../app/database/schema').driver;
const Driver 		= mongoose.model('Driver', driverSchema);

module.exports		= Driver;