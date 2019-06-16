/**
 *play_ad model
 */


const mongoose 		= require('mongoose');
const play_adSchema = require('../../app/database/schema').play_ad;
const play_ad 		= mongoose.model('Play_ad', play_adSchema);

module.exports = play_ad;