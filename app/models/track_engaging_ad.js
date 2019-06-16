/**
 *track_engaging_ad model
 */

const mongoose 					= require('mongoose');
const track_engaging_adSchema	= require('../../app/database/schema').track_engaging_ad;
const track_engaging_ad 		= mongoose.model('Track_engaging_ad', track_engaging_adSchema);

module.exports = track_engaging_ad;