/**
 *Contact Model
 */

const mongoose 			= require('mongoose');
const contactSchema 	= require('../../app/database/schema').contact;
const Contact 			= mongoose.model('Contact', contactSchema);

module.exports = Contact;