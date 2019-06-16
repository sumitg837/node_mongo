//Api controller
const mongoose 			= require('mongoose');
const path 				= require('path');
const async 			= require('async');
const multer 			= require('multer');
const formidable 		= require('formidable');
const fs 				= require('fs');
const env 		= require('../../app/config').env;
var config 		= require('../../app/config')[env];
var host 				= '';

var port 				= config.EnvPort.port;
let e_data 				= [];
//console.log(host);

const storage =	multer.diskStorage({
	destination: function(req, file, callback){
		callback(null, './assets/apiupload');
	},
	filename: function(req, file, callback){
		let t_string = Date.now().toString();
		callback(null, file.fieldname +'-' +t_string+ path.extname(file.originalname));
	}
});

//DB models
let Driver 				= require('../../app/models').driver;
let Advertisement 		= require('../../app/models').advertisement;
let Ad_assign 			= require('../../app/models').ad_assign;
let Track_email 		= require('../../app/models').track_email;
let Track_engaging_ad 	= require('../../app/models').track_engaging_ad;
let Contact 			= require('../../app/models').contact;
let Imei 				= require('../../app/models').imei;
let Play_ad 			= require('../../app/models').play_ad;
//check if object is empty
var isEmpty = function(obj) {
  for (var key in obj)
    if(obj.hasOwnProperty(key))
      return false;
  return true;
};
//validate incoming objectId
var validateObjectId = function(objectId){
	if(!mongoose.Types.ObjectId.isValid(objectId))
		return false;
	return true;
};
var objectToArray = function(obj) {
    var _arr = [];

    for (var key in obj) {
        _arr.push(key, obj[key]);
    }
    return _arr;
}

//time in sec
var timeToSec = function(time){
	if(time){
		let t_array = time.split(':');
		if(!t_array[2]){
			t_array[2] ='00';
		}
		let h = parseInt(t_array[0]);
		let m = parseInt(t_array[1]);
		let s = parseInt(t_array[2]);
		if((h > 24 || h < 0) || (m > 60 || m < 0) || (s > 60 || s < 0)){
			return 0;
		}else{
			let f_time = (parseInt(t_array[0])*60*60)+(parseInt(t_array[1])*60)+(parseInt(t_array[2]));
			return f_time;
		}
	}
	return 0;
}

//date validation
var validDate = function(date){
	if(date){
		let d_array = date.split('/');
		let mm = parseInt(d_array[0]);
		let dd = parseInt(d_array[1]);
		let yy = parseInt(d_array[2]);
		if((mm > 12 || mm < 1) || (dd >31 || dd < 1) || (yy <1 || d_array[2].length !=4 )){
			return false;
		}else{
			return true;
		}
	}
}

exports.contact = (req, res, next) =>{
	try{
		let name = req.body.name;
		let mobile = req.body.mobile;
		let email = req.body.email;
		let subject = req.body.subject;
		let query = req.body.query;
		if(name && mobile && email && subject && query){
			Contact.create({
				name : name,
				mobile : mobile,
				email : email,
				subject : subject,
				query : query,
				read : 'unread',
				create : Date.now()
			}, (err, result) =>{
				if(err){
					return res.send({status: 500, data: e_data, success: false, error: true, message: 'Internal Server Error'});
					res.end();
				}
				else if(result){
					return res.send({status: 200, data: e_data, success: true, error: false, message: 'Query placed successfully.'});
					res.end();
				}
			})
		}else{
			return res.send({status: 404, data: e_data, success: false, error: true, message: 'Field Name Required'});
			res.end();
		}
	}catch(error){
		throw error;
	}
};
//check imei
exports.imeis =(req, res, next) =>{
	try{
		let imei = req.body.imei;
		let data = [];
		host = 'http://'+req.headers.host;

		if(imei){
			//
			Driver.findOne({tablet1_udid: imei}, (err, result) =>{
				if(err) throw err;
				if(isEmpty(result)){
					Driver.findOne({tablet2_udid: imei}, (err, result1) =>{
						//if(err) throw err;
						if(isEmpty(result1)){
							//message = "empty";
							Imei.findOne({imei: imei}, (err, result3) => {
								if(isEmpty(result3)){
									Imei.create({
										imei : imei, config: 0, create : Date.now()
									}, (err, result4) =>{
										if(err){
											return res.send({status: 500, data: e_data, success: false, error: true, message: 'Internal Server Error'});
											res.end();
										}
										else if(result4){
											return res.send({
												status: 200, data: e_data,
												isConfigured: '0', success: true,
												error: false, message: 'Device Not configured.'
											});
											res.end();
										}
									});
								}else{
									return res.send({
										status: 200, data: e_data,
										isConfigured: '0', success: true,
										error: false, message: 'Device Not configured.'
									});
									res.end();
								}
							});
							
						}else{
							//message = 'not';
							let user_id = result1._id;
							Ad_assign.find({driver_id : user_id })
							.populate({
								path: 'advertisement_id',
								model: 'Advertisement',
							}).exec(function(err, result2){
								if(err){
									return res.send({
										status: 500, data: e_data,
										success: false, error: true,
										message: 'Internal Server Error'
									});
									res.end();
								}
								result2.forEach((item) =>{
									data.push({
										ad_id: item.advertisement_id._id,
										ad_url: host+'/assets/uploads/'+item.advertisement_id.link,
										ad_type: (item.advertisement_id.type == 'image') ? '1' : (item.advertisement_id.type == 'video') ? '2' : '3',
										ad_duration: item.advertisement_id.duration
									});
									// console.log(item.advertisement_id);
								});
								return res.send({
									status: 200, user_id: user_id, data: data,
									isConfigured: '1', success: true,
									error: false, message: 'Device Is configured .'
								});
								res.end();
							});
							
						}
					});
				}else{
					//message = 'not';
					let user_id = result._id;
					Ad_assign.find({driver_id : user_id })
					.populate({
						path: 'advertisement_id',
						model: 'Advertisement',
					}).exec(function(err, result2){
						if(err){
							return res.send({
								status: 500, data: e_data,
								success: false, error: true,
								message: 'Internal Server Error'
							});
						}
						result2.forEach((item) =>{
							data.push({
								ad_id: item.advertisement_id._id,
								ad_url: host+'/assets/uploads/'+item.advertisement_id.link,
								ad_type: (item.advertisement_id.type == 'image') ? '1' : (item.advertisement_id.type == 'video') ? '2' : '3',
								ad_duration: item.advertisement_id.duration
							});
							// console.log(item.advertisement_id);
						});
						return res.send({
							status: 200, user_id: user_id, data: data,
							isConfigured: '1', success: true,
							error: false, message: 'Device Is configured .'
						});
						res.end();
					});
				}
				//sts1 = isEmpty(result) ? true : false;
			});
		}else{
			return res.send({
				status: 404, data: e_data,
				isConfigured: '0', success: false,
				error: true, message: 'Field name is required.'
			});	
			res.end();
		}
		
	}catch(err){
		throw err;
	}
};

//subscription to ad
exports.subScribers = (req, res, next)=>{
	try{
		let user_id = req.body.user_id;
		let email = req.body.email;
		let ad_id = req.body.ad_id;
		if(user_id && email && ad_id){
			if(validateObjectId(user_id)){
				Track_email.findOne({ email : email, advertisement_id: ad_id }, (err, result) =>{
					if(err){
						return res.send({
							status: 500, data: e_data,
							isConfigured: '0', success: false,
							error: true, message: 'Internal server Error!.'
						});
						res.end();
					}
					if(isEmpty(result)){
						Track_email.create({
							driver_id : user_id,
							advertisement_id : ad_id,
							email : email,
							date : Date.now()
						}, (err, result1)=>{
							if(err){
								return res.send({
									status: 500, data: e_data,
									success: false,
									error: true, message: 'Internal server Error!.'
								});
								res.end();
							}
							else if(result1){
								Track_engaging_ad.update({
									driver_id: user_id,
									advertisement_id: ad_id
								},{$inc: {no_of_click: 1}},{upsert: true}, (err, result2)=>{
									if(result2){
										return res.send({
											status: 200, data: e_data,
											success: true,
											error: false, message: 'Subscribed successfully.'
										});
										res.end();
									}
								});
								
							}
						});	
					}else{
						Track_engaging_ad.update({
									driver_id: user_id,
									advertisement_id: ad_id
								},{$inc: {no_of_click: 1}},{upsert: true}, (err, result2)=>{
									if(result2){
										return res.send({
											status: 200, data: e_data,
											success: true,
											error: false, message: 'Subscribed Already..'
										});
										res.end();
									}
								});
						
					}
				});
			}else{
				return res.send({
					status: 404, data: e_data,
					success: false,
					error: true, message: 'Not a valid Driver_id'
				});
				res.end();
			}	
		}else{
			return res.send({
				status: 404, data: e_data,
				success: false,
				error: true, message: 'Field name is required.'
			});
			res.end();
		}
	}catch(error){
		throw error;
	}
};
//bulk subscription
exports.bulkSubscribers = (req, res, next) =>{
	try{
		var empty = false;
		var msg = 'Subscribed successfully';
		var already_subs =[];
		let object = req.body['subscribers'];
         object.forEach((item)=>{
         	if(isEmpty(item)){
         		empty = true;
         	}else{
         		if(item.user_id && item.email && item.ad_id){
         			// console.log(item.email);
         			Track_email.findOne({ email : item.email, advertisement_id: item.ad_id, driver_id: item.user_id }, (err, result) =>{
						if(err){
							return res.send({
								status: 500, data: e_data,
								success: false,
								error: true, message: 'Internal server Error!.'
							});
							res.end();
						}
						if(isEmpty(result)){
							Track_email.create({
								driver_id : item.user_id,
								advertisement_id : item.ad_id,
								email : item.email,
								date : Date.now()
							}, (err, result1)=>{
								if(err){
									return res.send({
										status: 500, data: e_data,
										success: false,
										error: true, message: 'Internal server Error!.'
									});
									res.end();
								}
								if(result1){
									Track_engaging_ad.update({
										driver_id: item.user_id,
										advertisement_id: item.ad_id
									},{$inc: {no_of_click: 1}},{upsert: true}, (err, result2)=>{
										if(err){
											return res.send({
												status: 500, data: e_data,
												success: false,
												error: true, message: 'Internal server Error!.'
											});
											res.end();
										}
										if(result2){
											empty = false;
											msg = 'Subscribed successfully.';
											
											// return res.send({
											// 	status: 200, data: e_data,
											// 	success: true,
											// 	error: false, message: 'Subscribed Already..'
											// });
											// res.end();
										}
									});
								}
							});	
						}else{
							Track_engaging_ad.update({
										driver_id: item.user_id,
										advertisement_id: item.ad_id
									},{$inc: {no_of_click: 1}},{upsert: true}, (err, result2)=>{
										if(err){
											return res.send({
												status: 500, data: e_data,
												success: false,
												error: true, message: 'Internal server Error!.'
											});
											res.end();
										}
										if(result2){
											empty = false;
											msg = 'These emails are already Subscribed.';
											
										}
									});
							
						}
					});
         		}else{
         			return res.send({
						status: 404, data: e_data,
						success: false,
						error: true, message: 'Field name is required.'
					});
					res.end();
         		}
         		
         	}
         	
         });
        if(empty){
         	return res.send({
				status: 404, data: e_data,
				success: false,
				error: true, message: 'Empty Request!.'
			});
			res.end();
        }else{
         	return res.send({
				status: 200, data: e_data,
				success: true,
				error: false, message: msg
			});
			res.end();
        }
		
	}catch(error){
		throw error;
	}
};
//ad-click
exports.adClick = (req, res, next) =>{
	try{
		let error = false;
		let click = false;
		let driver_id = req.query.user_id;
		let advertisement_id = req.query.ad_id;
		if(driver_id && advertisement_id){
			if(validateObjectId(driver_id)){
				Track_engaging_ad.findOne({driver_id: driver_id, advertisement_id: advertisement_id},
				(err, result)=>{
					if(isEmpty(result)){
						Track_engaging_ad.create({
							driver_id: driver_id,
							advertisement_id: advertisement_id,
							no_of_click: 1
						}, (err, result1)=>{
							if(err){
								error = true;
							}
							if(result1){
								return res.send({
									status: 200, data: e_data,
									success: true,
									error: false, message: 'Engaged successfully.'
								});
								res.end();
							}
						});
					}else{
						let click = result.no_of_click;
						let now_click = parseInt(click)+1;
						Track_engaging_ad.update({_id : result._id},
						{
							$set:{no_of_click : now_click}
						},(err, result2)=>{
							if(err){
								error = true;
							}
							if(result2){
								return res.send({
									status: 200, data: e_data,
									success: true,
									error: false, message: 'Engaged successfully.'
								});
								res.end();
							}
						});
					}
				});
				
				if(error){
					return res.send({
						status: 500, data: e_data,
						success: false,
						error: true, message: 'Internal server error.'
					});
					res.end();
				}
			}else{
				return res.send({
					status: 404, data: e_data,
					success: false,
					error: true, message: 'Invalid Information.'
				});
				res.end();
			}
		}else{
			return res.send({
				status: 404, data: e_data,
				success: false,
				error: true, message: 'Field name is required.'
			});
			res.end();
		}
	}catch(error){
		throw error;
	}
};
exports.playTime = (req, res, next) =>{
	try{
		let play_details = req.body['play_details'];
		let c_array = [];
		let e_array = [];
		let insert = true;
		let err = '';
		let msg = {};
		 
			if(play_details){
			play_details.forEach((play_detail) =>{
				if(play_detail.ad_id && play_detail.user_id && play_detail.start_time && play_detail.end_time && play_detail.play_date){
					let f_sTime = timeToSec(play_detail.start_time);
					let f_eTime = timeToSec(play_detail.end_time);
					if(f_sTime != 0 && f_eTime != 0 && validDate(play_detail.play_date) && insert){
						c_array.push({
							driver_id : play_detail.user_id,
							advertisement_id : play_detail.ad_id,
							play_date : new Date(play_detail.play_date),
							play_time : f_sTime,
							play_end_time : f_eTime
						});
						insert = true;
					}else{
						
						insert = false;
						return false;
					}	
				}else{
					return res.send({
						status: 404, data: e_data,
						success: false,
						error: true, message: 'Field name is required.'
					});
					res.end();
				}
				
			});
			// console.log(e_array);
			if(insert){
				async.series({
					
					play_ad: (callback) =>{
						Play_ad.create(c_array, (err, result)=>{
							callback(err, result);
						});
					}
				},(err, result)=>{
					if(err){
						return res.send({
							status: 500, data: err,
							success: false,
							error: true, message: 'Internal server error.'
						});
						res.end();
					}
					if(result){
						return res.send({
							status: 200, data: e_data,
							success: true,
							error: false, message: 'Play time inserted successfully.'
						});
						res.end();
					}
				});
			}else{
				return res.send({
					status: 404, data: e_data,
					success: false,
					error: true, message: 'Invaid Data Supplied!.'
				});
				res.end();
			}
			
		}else{
			return res.send({
				status: 404, data: e_data,
				success: false,
				error: true, message: 'Field name is required.'
			});
			res.end();
		}

		
		
		

	}catch(error){
		throw error;
	}
}
exports.test = (req, res, next) =>{
	try{
		// res.send(req.body['ad_id']+ req.body['user_id']);
		let ads = req.body['ads'];
		
		let p =[];
		ads.forEach((ad)=>{
			Advertisement.findOne({_id: ad.id, type: 'subscription'},(err, result)=>{
				if(err) throw err;
				if(!isEmpty(result)){
					Track_engaging_ad.findOne({driver_id: ad.user_id, advertisement_id: result._id},
					(err, result1)=>{
						if(isEmpty(result1)){
							Track_engaging_ad.create({
								driver_id: ad.user_id,
								advertisement_id: result._id,
								no_of_click: 1
							}, (err, result2)=>{
								if(err){
									error = true;
								}
								if(result2){
									return res.send({
										status: 200, data: e_data,
										success: true,
										error: false, message: 'Clicked.'
									});
									res.end();
								}
							});
						}else{
							let click = result1.no_of_click;
							let now_click = parseInt(click)+1;
							Track_engaging_ad.update({_id : result1._id},
							{
								$set:{no_of_click : now_click}
							},(err, result2)=>{
								if(err){
									error = true;
								}
								if(result2){
									return res.send({
										status: 200, data: e_data,
										success: true,
										error: false, message: 'Clicked.'
									});
									res.end();
								}
							});
						}
					});
				}
			});
		});
		console.log(p);
		res.send(p);
	}catch(err){
		throw err;
	}
}
