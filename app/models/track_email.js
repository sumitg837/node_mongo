/**
 *track_email model
 */

const mongoose 			= require('mongoose');
const track_emailSchema = require('../../app/database/schema').track_email;
const track_email 		= mongoose.model('Track_email', track_emailSchema);

module.exports = track_email;