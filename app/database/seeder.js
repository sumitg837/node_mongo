/**
 *user seeder
 */

const User = require('../../app/models').user;

module.exports = function(app){
	app.get('/setup', function(req, res){
		let startUser = [{
			name 	: 'Administrator',
			email 	: 'adtentio',
			password: 'Adtentio123',
			token 	: ''
		}];

		User.find({ name: 'Administrator' }).then((result) => {
			if(result){
				res.send('DB Already Seeded.');
			}
		}).catch((err) => {
			throw err;
		});

		User.create(startUser, function(err, result){
			const admin = result;
		});

		res.send('DB Seeded');
	});
}

/**
 *user seeder
 */
/*
const User = require('../../app/models').user;

module.exports = function(app){
	app.get('/setup', function(req, res){
		let startUser = [{
			name 	: 'Administrator',
			email 	: 'admin@adapp.com',
			password: 'admin1234',
			token 	: ''
		}];

		User.find({ name: 'Administrator' }).then((result) => {
			if(result){
				res.send('DB Already Seeded.');
			}
		}).catch((err) => {
			throw err;
		});

		User.create(startUser, function(err, result){
			const admin = result;
		});

		res.send('DB Seeded');
	});
}

*/