//login page
let User = require('../../app/models/user');
//login
exports.index = (req, res, next) => {
	try{
		if(req.session && req.session.user){
			res.redirect('/dashboard');
			res.end();
			return ;
		}else{
			res.render('login', { session: req.session });
			res.end();
			return ;
		}
	}catch(error){
		console.log(error);
	}
};
//Authenticate User
exports.authenticateLogin = (req, res, next) => {
	try{
		let email = req.body.email;
		let password = req.body.password;
		User.findOne({ email: email, password: password})
		.then((admin) => {
			if(admin){
				req.session.user = admin;
				res.redirect('/dashboard');
				res.end();
				return ;
			}else{
				res.redirect('/');
				res.end();
				return ;
			}
		}).catch(err => {
			throw err;
		});
	}catch(error){
		console.log(error);
	}
};
//error 404
exports.error = (req, res, next) =>{
	try{
		res.render('error', { session: req.session });
		res.end();
		return ;
	}catch(error){
		throw error;
	}
}
//logout
exports.logout = (req, res, next) => {
	try{
		req.session.destroy();
		res.redirect('/');
		res.end();
		return ;
	}catch(error){
		throw error;
	}
};

