//dashboard controller
const mongoose      = require('mongoose');
const path        	= require('path');
const async       	= require('async');
const multer      	= require('multer');
const formidable    = require('formidable');
const fs       	 	= require('fs');
const tableToCsv 	= require('node-table-to-csv');

const storage = multer.diskStorage({
  destination: function(req, file, callback){
    callback(null, './assets/uploads');
  }, 
  filename : function(req, file, callback){
    let t_string = Date.now().toString();
    callback(null, file.fieldname + '-' +t_string+ path.extname(file.originalname));
  }
});

//DB Models
let Driver        		= require('../../app/models').driver;
let Advertisement    	= require('../../app/models').advertisement;
let Ad_assign       	= require('../../app/models').ad_assign;
let Track_email     	= require('../../app/models').track_email;
let Track_engaging_ad   = require('../../app/models').track_engaging_ad;
let Contact       		= require('../../app/models').contact;
let Imei        		= require('../../app/models').imei;
let Play_ad       		= require('../../app/models').play_ad;

//validate incoming request
let validateRequest = (req, res, next) => {
	// console.log(req.session.user);
  if(!req.session.user){
    res.redirect('/');
    return ;
  }
  return;
}

//check if object is empty
var isEmpty = function(obj) {
  for (var key in obj)
    if(obj.hasOwnProperty(key))
      return false;
  return true;
}

//validate incoming objectId
var validateObjectId = function(objectId){
  if(!mongoose.Types.ObjectId.isValid(objectId))
    return false;
  return true;
};

//time in sec
var timeToSec = function(time){
	if(time){
		let t_array = time.split(':');
		let f_time = (parseInt(t_array[0])*60*60)+(parseInt(t_array[1])*60)+(parseInt(t_array[2]));
		return f_time;
	}
	return '';
};

//calculate no of time an advertisement played
var calculateNo = function(total_sTime, total_eTime, ad_duration){
	let no = 0;
	if(total_sTime && total_eTime && ad_duration){
		no = (total_eTime - total_sTime)/ad_duration;
		no = parseInt(no);
		return no;
	}
	return no;
};

//dashboard
exports.index = (req, res, next) => {
    try{
    validateRequest(req, res);

    async.series({
      drivers: (callback) => {
        Driver.find({}, (err, drivers) => {
          callback(err, drivers);
        });
      },
      advertisements: (callback) => {
        Advertisement.find({}, (err, advertisements) => {
          callback(err, advertisements);
        });
      },
      contacts: (callback) => {
        Contact.find({read: 'unread'}, (err, contact) => {
          callback(err, contact);
        }).sort({ _id : -1 });
      },
      subscribers: (callback) =>{
        Track_email.find({}, (err, subscriber)=>{
          callback(err, subscriber);
        });
      },
      engageds: (callback) =>{
        Track_engaging_ad.find({}, (err, count)=>{
          callback(err, count);
        });
      }
    }, (err, results) => {
      if(err) throw err;
      else{
      	res.render('dashboard',
		      { 
		        advertisements: results.advertisements,
		        drivers: results.drivers,
		        contacts: results.contacts,
		        subscribers: results.subscribers,
		        engageds: results.engageds,
		        session : req.session
		      });
		      res.end();
		      return ;
		}
    });

  }catch(error){
    res.render('error')
  }
}

//advertisement
exports.advertisement = (req, res, next) => {
  try{
    validateRequest(req, res);
    async.series({
      advertisements: (callback) => {
        Advertisement.find({}, (err, advertisements) => {
          callback(err, advertisements);
        });
      },
      contacts: (callback) => {
        Contact.find({read: 'unread'}, (err, contact) => {
          callback(err, contact);
        }).sort({ _id : -1 });
      }
    }, (err, results) => {
      //console.log(results);
      if(err) throw err;
      else{
      res.render('advertisement', 
        {
          advertisements: results.advertisements,
          contacts: results.contacts,
          session: req.session
        });
      res.end();
      return ;
    	}
    });
  }catch(error){
    throw error;
  }
}


//add Advertisement
exports.addAdvertisement = (req, res, next) => {
  try{
    validateRequest(req, res);
    let upload = multer({storage: storage}).single('file');
    upload(req, res, function(err){
	    if(err){
	        res.end(`errro. ${err}`);
	        return ;
	    }	
	    let name = req.body.name;
	    let type = req.body.type;
	    let link = req.file.filename;
	    let res_send = false;
	    if((type != (req.file.mimetype).substring(0,5) && type != 'subscription') || (type == "subscription" && (req.file.mimetype).substring(0,5) == 'video')){
	        fs.stat('./assets/uploads/'+link, function (err, stats) {
	           //onsole.log(stats);//here we got all information of file in stats variable

	           if (err) {
	               return console.error(err);
	           }

	           fs.unlink('./assets/uploads/'+link,function(err){
	                if(err) return console.log(err);
	               // console.log('file deleted successfully');
	           });  
	        });

	        req.session.sessionFlash = {
	            type: 'danger',
	            message: 'File uploaded is not of advertisement type!.'
	        };
	        
	        res.redirect('/advertisement');
	        res.end();
	        return ;
        }else{
      		let duration = req.body.duration;
	    	if(req.file && name && duration){
		        //console.log(req.file.filename);
		        
		        let create = Date.now();
		        let size = parseInt(parseInt(req.file.size)/(1024*1024));
		        //type = (req.file.mimetype).substring(0,5);
		        if(size < 26){
	          		Advertisement.findOne({name: name}, (err, result) =>{
		          	//console.log(result);
			          	if(result){
				            fs.stat('./assets/uploads/'+link, function (err, stats) {
				               //onsole.log(stats);//here we got all information of file in stats variable

				               	if (err) {
				                   return console.error(err);
				               	}

				               	fs.unlink('./assets/uploads/'+link,function(err){
				                    if(err) return console.log(err);
				                   // console.log('file deleted successfully');
				               	});  
				            });
				            req.session.sessionFlash = {
			                  	type: 'danger',
			                  	message: 'This Advertisement name is Already Added!.Use Unique Advertisement Name!.'
			              	};
			              	return res.redirect('/advertisement');
			              	res.end();
			                      
			          	}else{
		              		Advertisement.create({
			                name : name,
			                type : type,
			                duration : duration,
			                link : link,
			                create : create,
			                modify : create
			              	}, (err, result)=>{
				                if (result) {
		                            req.session.sessionFlash = {
		                                type: 'success',
		                                message: 'Advertisement Created successfully!.'
		                            };
		                        }
			                    res.redirect('/advertisement');
			                    res.end();
			                    return ;
			              });
			            
			          	}
		        	});
		        }else{
		          	fs.stat('./assets/uploads/'+link, function (err, stats) {
		               //onsole.log(stats);//here we got all information of file in stats variable

		               if (err) {
		                   return console.error(err);
		               }

		               fs.unlink('./assets/uploads/'+link,function(err){
		                    if(err) return console.log(err);
		                   // console.log('file deleted successfully');
		               });  
		            });
		           	req.session.sessionFlash = {
                      	type: 'danger',
                      	message: 'File size must be less than 25MB!.'
                  	};
                  	res.redirect('/advertisement');
                  	res.end();
                  	return ;
		        }
		    }else{
		        req.session.sessionFlash = {
                    type: 'danger',
                    message: 'please select a File!.'
                };
                res.redirect('/advertisement');
                res.end();
                return ;
		    }
        }
    });

    

  }catch(error){
    throw error;
  }
}

//edit advertisement
exports.editAdvertisement = (req, res, next) =>{
  try{
    validateRequest(req, res);
    let id = req.body.id;
    if(validateObjectId(id)){
      async.series({
        advertisement: (callback) =>{
          Advertisement.findOne({_id: id}, (err, result) =>{
            callback(err, result);
          });
        }
      }, (err, result) =>{
          if(err) throw err;
          else{
            return res.send(JSON.stringify({result: result.advertisement}));
             res.end();
          }
      });
    }else{
      return res.send(JSON.stringify({result:'Not Valid Information!'}));
      res.end();
    }
  }catch(err){
    throw err;
  }
}

//update Advertisement
exports.updateAdvertisement = (req, res, next) => {
  try{
    validateRequest(req, res);
    let upload = multer({storage: storage}).single('file');
    upload(req, res, function(err){
	  	if(err){
	        return res.end(`errro. ${err}`)
	  	}
	  	let _id = req.body.ad_id;
	  	let prv_pic = req.body.prv_pic;
	  	let name = req.body.name;
	  	let type = req.body.type;
		let link = req.file.filename;
	  	if((type != (req.file.mimetype).substring(0,5) && type != 'subscription') || (type == "subscription" && (req.file.mimetype).substring(0,5) == 'video')){
	    	fs.stat('./assets/uploads/'+link, function (err, stats) {
               //onsole.log(stats);//here we got all information of file in stats variable

               	if (err) {
                   return console.error(err);
               	}

               	fs.unlink('./assets/uploads/'+link,function(err){
                    if(err) return console.log(err);
                   // console.log('file deleted successfully');
               	});  
            });
	    	req.session.sessionFlash = {
                type: 'danger',
                message: 'File uploaded is not of advertisement type!.'
            };
            res.redirect('/advertisement');
            res.end();
            return ;    
	  	}else{
	  		let duration = req.body.duration;
	      	let modify = Date.now();
	      	let size = parseInt(parseInt(req.file.size)/(1024*1024));
		      // type = (req.file.mimetype).substring(0,5);
	      	if(validateObjectId(_id)){

		        if(size < 26){
		          	Advertisement.findOne({name: name}, (err, result) =>{
			            if(err) throw err;
			          	if(_id != result._id){
	                        fs.stat('./assets/uploads/'+link, function (err, stats) {
	                           //onsole.log(stats);//here we got all information of file in stats variable

	                           if (err) {
	                               return console.error(err);
	                           }

	                           fs.unlink('./assets/uploads/'+link,function(err){
	                                if(err) return console.log(err);
	                               // console.log('file deleted successfully');
	                           });  
	                        });
	                        req.session.sessionFlash = {
	                            type: 'danger',
	                            message: 'This Advertisement name is Already Added!.Use Unique Advertisement Name!.'
	                        };
	                        res.redirect('/advertisement');
	                        res.end();
	                        return ;
	                    }else{
	                        Advertisement.update({_id: _id},
	                        { $set: {
	                            name : name,
	                            type : type,
	                            duration : duration,
	                            link : link,
	                            modify: Date.now()
	                            }
	                        }, (err, result)=>{
	                        	if(err) throw err;
	                            if (result) {
	                                fs.stat('./assets/uploads/'+prv_pic, function (err, stats) {
	                                   //onsole.log(stats);//here we got all information of file in stats variable

	                                   if (err) {
	                                       return console.error(err);
	                                   }

	                                   fs.unlink('./assets/uploads/'+prv_pic,function(err){
	                                        if(err) return console.log(err);
	                                       // console.log('file deleted successfully');
	                                   });  
	                                });
	                                req.session.sessionFlash = {
	                                    type: 'success',
	                                    message: 'Advertisement updated successfully!.'
	                                };
	                                res.redirect('/advertisement');
	                                res.end();
	                                return ;
	                            }
	                        });
	                	}
		          	});
        		}else{
		          	fs.stat('./assets/uploads/'+link, function (err, stats) {
		               //onsole.log(stats);//here we got all information of file in stats variable

		               if (err) {
		                   return console.error(err);
		               }

		               fs.unlink('./assets/uploads/'+link,function(err){
		                    if(err) return console.log(err);
		                   // console.log('file deleted successfully');
		               });  
		            });
		           	req.session.sessionFlash = {
                      	type: 'danger',
                      	message: 'File size must be less than 25MB!.'
                  	};
                  	res.redirect('/advertisement');
                  	res.end();
                  	return ;
		        }
			}else{
		        res.render('error');
		        res.end();
		        return ;
		        //return res.send(JSON.stringify({result:'Not Valid Information!'}));   
	      	}
	  	}
    });

    

  }catch(error){
    throw error;
  }
}


//remove advertisement
exports.removeAd =(req, res, next) =>{
  try{
    validateRequest(req, res);
    let id = req.params.id;
    if(validateObjectId(id)){
      	async.series({
	        Ad_assign: (callback) =>{
	              Ad_assign.deleteMany({advertisement_id: id}, (err, results) =>{
	                 callback(err, results);    
	              });
	        },
	        Track_email: (callback) =>{
	          Track_email.deleteMany({advertisement_id: id}, (err, result) =>{
	             callback(err, result);
	          });
	        },
	        Track_engaging_ad: (callback) =>{
	          Track_engaging_ad.deleteMany({advertisement_id: id}, (err, result) =>{
	              callback(err, result);
	          });
	        },
	        Play_ad: (callback) =>{
	        	Play_ad.deleteMany({advertisement_id: id}, (err, result) =>{
	        		callback(err, result);
	        	})
	        },
	        Advertisement: (callback) =>{
	              Advertisement.remove({_id : id}, (err, result1) =>{
	                callback(err, result1);
	              }); 
	        }
      	}, (err, result) =>{
        if(err) throw err;
        if(result){
          req.session.sessionFlash = {
                      type: 'success',
                      message: 'Advertisement Removed!.'
                  };
                  return res.redirect('/advertisement');
                  res.end();
            }
            
    	});
    }else{
      return res.redirect('/error');
      res.end();
    }
    
    
  }catch(err){
    throw err;
  }
}


//drivers
exports.drivers = (req, res, next) => {
	try{
	    validateRequest(req, res);

    	async.parallel({
    		drivers: (callback) =>{
    			Driver.find({}, (err, result)=>{
    				callback(err, result);
    			})
    		},
	      	advertisements: (callback) => {
	      	  	Advertisement.find({}, (err, advertisements) => {
		          	callback(err, advertisements);
	        	});
	      	},
	      	contacts: (callback) => {
		        Contact.find({read: 'unread'}, (err, contact) => {
		          	callback(err, contact);
		        }).sort({ _id : -1 });
	      	},
	      	imeis: (callback) =>{
		        Imei.find({config: 0 }, (err, imei)=>{
		          	callback(err, imei);
		        });
	      	}
    	}, (err, results) => {
      //console.log(results.ad_assigns);
      var driverId = '';
      // var ad_assign_id = '';
      var name = '';
      var driver_id = '';
      var status = '';
      var ad = 0;
      var tablets = 0;
      var imei1 = 0;
      var imei2 = 0;
      var ad_assigns_array = [];
      var sts = true;
      results.drivers.forEach((drivers)=>{
        
        if(driver_id != drivers.driver_id ){
          driverId = drivers._id;
          // ad_assign_id = ad_assigns._id; 
          name = drivers.name;
          driver_id = drivers.driver_id;
          status = drivers.status;
          tablets = drivers.tablet1_udid != 0 ? tablets+1 : tablets;
          tablets = drivers.tablet2_udid != 0 ? tablets+1 : tablets;
          ad = ad
          imei1 = drivers.tablet1_udid;
          imei2 = drivers.tablet2_udid;
          ad_assigns_array.push({
            driverId : driverId,
            name: name,
            driver_id: driver_id,
            status: status,
            tablets: tablets,
            imei1: imei1,
            imei2: imei2,
            ad: ad
          });
          _id = '';
          name = '';
          //driver_id = '';
          status = '';
          ad = 0;
          tablets = 0;
          imei1 = 0;
          imei2 = 0;
        }else{
          ad+1;
        }
        
      });
      //console.log(ad_assigns_array);
      return res.render('users', {drivers: ad_assigns_array, advertisements: results.advertisements, contacts: results.contacts, imeis:results.imeis, session: req.session});
      res.end();
    });
	}catch(error){
	throw error;
	}
}


//add Driver
exports.addDriver = (req, res, next) => {
  	try{
	    validateRequest(req, res);
	    let driver_name = req.body.driver_name;
	    let driver_id = req.body.driver_id;
	    let email = req.body.email;
	    let status = req.body.status;
	    let tablet1 = req.body.tablet1;
	    let tablet2 = req.body.tablet2;
	    let field = req.body['field[]'];
	    let fields =[];
	    let imeis = [];
	    let message = null;
	    if(tablet1 != tablet2 && driver_name !='' && driver_id !='' && email !=''){
	    	// console.log(driver_id)
		    async.waterfall([
		    	driver = (callback) =>{
		    		Driver.find({driver_id: driver_id}, (err, result)=>{
		    			callback(err, result);
		    		})
		    	},
		    	isDriver = (result, callback)=>{
		    		if(isEmpty(result)){
		    			Driver.create({
				            name: driver_name,
				            driver_id: driver_id,
				            email: email,
				            status: status,
				            tablet1_udid:tablet1,
				            tablet2_udid:tablet2,
				            creates:Date.now(),
				            modify:Date.now()
			          	}, (err, result1) => {
			          		callback(err, result1, true);
			          	});
		    		}else{
		    			callback(null, 'This Driver ID Already exists! Use Other Id.', false);
		    		}
		    	},
		    	ad_assigns = (result1, status, callback)=>{
	              	if(status){
	              		if(typeof(field) != 'string'){
		                    for(let i =0; i < field.length; i++){
		                      fields.push({
		                        driver_id: result1._id,
		                        advertisement_id: field[i],
		                        assign_time: Date.now(),
		                        deassign_time: Date.parse("1/1/1970 12:00:00 AM")
		                      });
		                    }
		              	}else{
		                    fields.push({
		                        driver_id: result1._id,
		                        advertisement_id: field,
		                        assign_time: Date.now(),
		                        deassign_time: Date.parse("1/1/1970 12:00:00 AM")
		                  	});
		              	}
		              	Ad_assign.insertMany(fields, (err, result2) =>{
		                	callback(err, result1, true);
		              	});
	              	}else{
	              		callback(null, result1, false);
	              	}
	            },
	            imeiDelete = (result1, status, callback)=>{
	            	if(status){
	            		if(tablet1 != '0'){
	            			Imei.remove({imei: tablet1}, (err, result4) =>{
	            				if(tablet2 != '0'){
									Imei.remove({imei: tablet2}, (err, result5) =>{
										callback(err, result1, true);
									})	            					
	            				}else{
	            					callback(err, result1, true);
	            				}
	            			});
	            		}else{
	            			Imei.remove({imei: tablet2}, (err, result5) =>{
	            				callback(err, result1, true);
	            			});
	            		}
	            	}else{
	            		callback(null, result1, false);
	            	}
	            },
	            imeiInsert = (result1, status, callback)=>{
	            	if(status){
	            		if(tablet1 != '0'){
	            			imeis.push({
	            				imei: tablet1,
	            				config: 1,
	            				create: Date.now()
	            			});
		              	}
		              	if(tablet2 != '0'){
		              		imeis.push({
		              			imei: tablet2,
		              			config: 1,
		              			create: Date.now()
		              		});
		              	}
		              	Imei.insertMany(imeis, (err, result3) =>{
		                	callback(err, "Driver Added!", true);
		              	});
	            	}else{
	            		callback(null, result1, true);
	            	}
	              	
	            }
		    ],(err, result) =>{
		    	if(err) throw err;
		    	// console.log(result);
		    	else{
		    		return res.send(JSON.stringify({message: result}));
		    		res.end();
		    	}
		    	
		    });
	    }else{
	    	return res.send(JSON.stringify({message: 'Pls fill correct informations.'}));
	    	res.end();
	    }
	    
  	}catch(error){
    throw error;
  	}
}


//edit driver
exports.editDriver = (req, res, next) =>{
  try{
    validateRequest(req, res);
    let id = req.body.id;
      async.series({
        find: (callback) =>{
          Driver.findOne({ _id: id }, (err, results) => {
            callback(err, results);
          });
        }
      }, (err, result)=>{
        if(err) throw err;
        if(result){
          return res.send(JSON.stringify({result: result.find }));
          res.end();
        }
        
      });
  }catch(error){
    throw error;
  }
}


//update driver
exports.updateDriver = (req,res, next) =>{
  try{
    validateRequest(req, res);
    let _id = req.body._id;
    let driver_name = req.body.driver_name;
    let driver_id = req.body.driver_id;
    let email = req.body.email;
    let status = req.body.status;
    let tablet1_udid = req.body.tablet1;
    let tablet2_udid = req.body.tablet2;
    let field = req.body['field[]'];
    let fields =[];
    let message = null;
    // console.log(tablet1_udid+','+tablet2_udid+','+driver_name+','+email);
	if(tablet1_udid != tablet2_udid && driver_name && driver_id && email){
        async.series({
          	imei: (callback)=>{
	            if(tablet1_udid != '0' && tablet2_udid =='0'){
	              	Driver.findOne({ _id: _id }, (err, result) =>{
		                if(result.tablet1_udid != tablet1_udid){
		                  	Imei.update({imei: result.tablet1_udid},
		                    {$set: {config: 0 }},
		                    (err, result1)=>{
			                  	Imei.update({imei: tablet1_udid}, {$set: {config : 1}},
				                  (err, result2)=>{
				                    // callback(err, result2)
				                    Imei.update({imei: result.tablet2_udid}, {$set: {config : 0}},
					                  (err, result3)=>{
					                    callback(err, result3)
				                  	});
			                  	});
		                    });
		                }else{
		                  Imei.update({imei: tablet1_udid}, {$set: {config : 1}},
		                    (err, result3)=>{
		                      	// callback(err, result3);
		                      	Imei.update({imei: result.tablet2_udid}, {$set: {config : 0}},
					                  (err, result4)=>{
					                    callback(err, result4)
				                  	});
		                    });
		                }
	              	});
	            }else if(tablet2_udid != '0' && tablet1_udid == '0'){
	              	Driver.findOne({ _id: _id }, (err, result) =>{
		                if(result.tablet2_udid != tablet2_udid){
		                  Imei.update({imei: result.tablet2_udid},
		                    {$set: {config: 0 }},
		                    (err, result1)=>{
		                      Imei.update({imei: tablet2_udid}, {$set: {config : 1}},
		                      (err, result2)=>{
		                        // callback(err, result2);
		                        	Imei.update({imei: result.tablet1_udid}, {$set: {config : 0}},
					                  (err, result3)=>{
					                    callback(err, result3)
				                  	});
		                      });
		                    });
		                }else{
		                  Imei.update({imei: tablet2_udid}, {$set: {config : 1}},
		                    (err, result3)=>{
		                      // callback(err, result3);
		                      		Imei.update({imei: result.tablet2_udid}, {$set: {config : 0}},
					                  (err, result4)=>{
					                    callback(err, result4)
				                  	});
		                    });
		                }
	              	});
	            }else{
	            	Driver.findOne({ _id: _id }, (err, result) =>{
		                if(result.tablet1_udid != tablet1_udid){
		                  	Imei.update({imei: result.tablet1_udid},
		                    {$set: {config: 0 }},
		                    (err, result1)=>{
			                  	Imei.update({imei: tablet1_udid}, {$set: {config : 1}},
				                  (err, result2)=>{
				                  	if(result.tablet2_udid != tablet2_udid){
				                  		Imei.update({imei: result.tablet2_udid},
					                    {$set: {config: 0 }},
					                    (err, result1)=>{
					                      Imei.update({imei: tablet2_udid}, {$set: {config : 1}},
					                      (err, result2)=>{
					                        callback(err, result2);
					                      });
					                    });
				                  	}else{
			                  			Imei.update({imei: tablet2_udid}, {$set: {config : 1}},
					                      (err, result2)=>{
					                        callback(err, result2);
				                      	});
				                  	}
			                  	});
		                    });
		                }else{
		                  Imei.update({imei: tablet1_udid}, {$set: {config : 1}},
		                    (err, result4)=>{
		                      	if(result.tablet2_udid != tablet2_udid){
			                  		Imei.update({imei: result.tablet2_udid},
				                    {$set: {config: 0 }},
				                    (err, result1)=>{
				                      Imei.update({imei: tablet2_udid}, {$set: {config : 1}},
				                      (err, result2)=>{
				                        callback(err, result2);
				                      });
				                    });
			                  	}else{
		                  			Imei.update({imei: tablet2_udid}, {$set: {config : 1}},
				                      (err, result3)=>{
				                        callback(err, result3);
			                      	});
			                  	}
		                    });
		                }
	              	});
	            }
          	},
          	FindDriver: (callback) =>{
                Driver.update({_id: _id},
                { $set: {
                  name :driver_name,
                  email: email,
                  status: status,
                  tablet1_udid: tablet1_udid,
                  tablet2_udid: tablet2_udid,
                  modify: Date.now()
                  }
                }, (err, result1) =>{
                  callback(err, result1);
                });
          	},
          	UpdateAssign: (callback) =>{
	            Ad_assign.deleteMany({driver_id : _id}, (err, result) =>{
	              	callback(err, result);
	              // return callback(err, result);
	            });
          	},
          	ad_assigns: (callback) =>{
	          	if(typeof(field) != 'string'){
	                for(let i =0; i < field.length; i++){
	                  fields.push({
	                    driver_id: _id,
	                    advertisement_id: field[i],
	                    assign_time: Date.now(),
	                    deassign_time: Date.parse("1/1/1970 12:00:00 AM")
	                  });
	                }
	          	}else{
	                fields.push({
	                    driver_id: _id,
	                    advertisement_id: field,
	                    assign_time: Date.now(),
	                    deassign_time: Date.parse("1/1/1970 12:00:00 AM")
	                  });
              	}
              	Ad_assign.insertMany(fields, (err, results) =>{
	                callback(err, results) ;   
              	});
          	}
        }, (err, result) =>{
	        if(err)
	            throw err;
	    	else{
	            return res.send(JSON.stringify({message: 'Driver Details Updated!.'}));
	            res.end();
	        }
        });
  	}else{
        message ='Enter Valid Informations!';
        return res.send(JSON.stringify({message: message}));
        res.end();
  	}
    
    
  }catch(error){
    throw error;
  }
};


//remove driver
exports.removeDriver =(req, res, next) =>{
  try{
    validateRequest(req, res);
    let id = req.params.id;
      	async.series({
        Ad_assign: (callback) =>{
          Ad_assign.deleteMany({driver_id: id}, (err, results) =>{
            callback(err, results);
          });
        },
        Track_email: (callback) =>{
          Track_email.deleteMany({driver_id: id}, (err, result1) =>{
            callback(err, result1);
          });
        },
        Track_engaging_ad: (callback) =>{
          Track_engaging_ad.deleteMany({driver_id: id}, (err, result2) =>{
            callback(err, result2);
          });
        },
        Play_ad: (callback) =>{
        	Play_ad.deleteMany({driver_id: id}, (err, result) =>{
        		callback(err, result);
        	});
        },
        Imei: (callback) =>{
          Driver.findOne({_id : id}, (err, result3)=>{
            if(result3.tablet1_udid != '0' && result3.tablet2_udid == '0'){
              Imei.remove({imei : result3.tablet1_udid},
                (err, result4)=>{
                  callback(err, result4);
                });
            }else if(result3.tablet2_udid != '0' && result3.tablet1_udid == '0'){
              Imei.remove({imei : result3.tablet2_udid},
                (err, result4)=>{
                  	callback(err, result4);
                });
            }else{
            	let del_imei = [{"imei": result3.tablet1_udid},{"imei": result3.tablet2_udid}];

            	Imei.deleteMany(del_imei, (err, result4) =>{
            		callback(err, result4);
            	});
            }
            // callback(err, 'remove');
          });
          
        },
        Driver: (callback) =>{
          	Driver.remove({_id : id}, (err, result1) =>{
            	callback(err,  result1);
          	});
        }
      	}, (err, result) =>{
        if(err) throw err;
        if(result){

          req.session.sessionFlash = {
                      type: 'success',
                      message: 'Driver Removed!.'
                  };
                return res.redirect('/drivers');
                res.end();
            }
      });
    
  }catch(err){
    throw err;
  }
};


//contact query
exports.contact =(req, res, next) =>{
  try{
    validateRequest(req, res);
    async.parallel({
      contact: (callback)=>{
        Contact.find({}, (err, result) =>{
          callback(err, result);
        }).sort({_id : -1});
      },
      contacts: (callback) => {
        Contact.find({read: 'unread'}, (err, contact) => {
          callback(err, contact);
        }).sort({ _id : -1 });
      },
    },(err, result) => {
      if(err) throw err;
      res.render('contact', {contacts : result.contacts,contact : result.contact, session: req.session });
      return ;
    }); 
  }catch(error){
    throw error;
  }
};
//view notification
exports.viewNotification = (req, res, next) =>{
  try{
    let id = req.params.id;
    if(validateObjectId(id)){
      	async.series({
	        status: (callback) =>{
	          Contact.update({_id : id}, {$set:{read: 'read'}}, (err, result)=>{
	            callback(err, result);
	          })
	        },
	        contact: (callback) =>{
	          Contact.findOne({_id : id}, (err, contact)=>{
	            callback(err, contact);
	          });
	        },
	        contacts: (callback)=>{
	          Contact.find({read: 'unread'}, (err, result) =>{
	            callback(err, result);
	          }).sort({_id : -1});
	        }
      	}, (err, result) =>{
	        if(err) throw err;
	        // console.log(result.contact);
	        else{
		        res.render('view_notification', { contact: result.contact, contacts : result.contacts, session: req.session });
		        return ;
	        }
      	});
    }else{
      res.redirect('/error');
      return ;
    }
  }catch(err){
    throw err;
  }
};
//remove contact query
exports.removeContact = (req, res, next) =>{
  try{
    validateRequest(req, res);
    let id = req.params.id;
    if(validateObjectId(id)){
      	async.parallel({
	        contact: (callback) =>{
	          Contact.remove({_id : id}, (err, result1) =>{
	            callback(err,  result1);
	          });
	        }
      	}, (err, result) =>{
	        if(err) throw err;
	        if(result){
		      	req.session.sessionFlash = {
		                  type: 'success',
		                  message: 'Contact Removed!.'
	              	};
	            return res.redirect('/contact');
	            res.end();
	        }
      	});
    }else{
      res.redirect('/error');
      return ;
    }
  }catch(err){
    throw err;
  }
};
//subscribers
exports.subscriber = (req, res, next) => {
    try{
    validateRequest(req, res);
    // let session = req.session;

    async.parallel({
      drivers: (callback) => {
        Driver.find({}, (err, drivers) => {
          callback(err, drivers);
        });
      },
      advertisements: (callback) => {
        Advertisement.find({}, (err, advertisements) => {
          callback(err, advertisements);
        });
      },
      contacts: (callback) => {
        Contact.find({read: 'unread'}, (err, contact) => {
          callback(err, contact);
        }).sort({ _id : -1 });
      },
      subscribers: (callback) =>{
        Track_email.find({}, (err, subscriber)=>{
          callback(err, subscriber);
        });
      },
      ad_subscribers: (callback) =>{
        Track_email.find({})
        .populate({
          path: 'driver_id',
          model: 'Driver',
        }).populate({
          path: 'advertisement_id',
          model: 'Advertisement',
        }).exec(function(err, ad_assigns){
          callback(err, ad_assigns);
        });
      }
    }, (err, results) => {
      //console.log(results.Ad_subscribers);
      res.render('subscriber',
      { 
        advertisements: results.advertisements,
        drivers: results.drivers,
        contacts: results.contacts,
        subscribers: results.subscribers,
        ad_subscribers: results.ad_subscribers,
        session : req.session
      });
      return ;      
    });

  }catch(error){
    console.log('Error::')
    throw error;
  }
};

//adEngage
exports.adEngage = (req, res, next) =>{
  try{
    validateRequest(req, res);
    async.parallel({
      contacts: (callback) => {
        Contact.find({read: 'unread'}, (err, contact) => {
          callback(err, contact);
        }).sort({ _id : -1 });
      },
      adengages: (callback) =>{
        Track_engaging_ad.find({})
        .populate({
          path: 'advertisement_id',
          model: 'Advertisement',
        })
        .populate({
        	path: 'driver_id',
        	model: 'Driver',
        }).exec((err, result)=>{
          callback(err, result);
        });
      }
    }, (err, results) => {
      // console.log(results.adengages);
      res.render('adengage', { adengages: results.adengages, contacts: results.contacts, session: req.session});
      return ;  
    });
    
  }catch(err){
    throw err;
  }
}

//ad-count
exports.adCount = (req, res, next) =>{
  	try{
	    validateRequest(req, res);
	    let id  = req.body.id;
	    //console.log(id);
	    if(validateObjectId(id)){
	      Ad_assign.count({driver_id: id}, (err, count)=>{
	        return res.send(JSON.stringify({count: count}));
	        res.end();
	      });
	    }else{
	      return res.send(JSON.stringify({error: 'not valid id'}));
	      res.end();
	    }
  	}catch(err){
    	throw err;
  	}
}


//revenue

exports.revenue = (req, res, next) =>{
	try{
		validateRequest(req, res);
		async.series({
			drivers: (callback) =>{
				Driver.find({}, (err, result)=>{
					callback(err, result);
				})
			},
			advertisements: (callback) =>{
				Advertisement.find({}, (err, result)=>{
					callback(err, result);
				})
			},
			contacts: (callback) => {
		        Contact.find({read: 'unread'}, (err, contact) => {
		          callback(err, contact);
		        }).sort({ _id : -1 });
	      	},
	      	subscribers: (callback) =>{
		        Track_email.find({}, (err, subscriber)=>{
		          callback(err, subscriber);
		        });
	      	},
	      	engageds: (callback) =>{
		        Track_engaging_ad.find({}, (err, count)=>{
		          callback(err, count);
		        });
	      	}			
		}, (err, results) =>{
			if(err) throw err;
			if(results){
				return res.render('revenue', {
					advertisements: results.advertisements,
			        drivers: results.drivers,
			        contacts: results.contacts,
			        subscribers: results.subscribers,
			        engageds: results.engageds,
			        showData: false,
			        session : req.session
				})
				res.end();
			}
		});
	}catch(error){
		throw error;
	}
}

//fetchRevenue

exports.fetchRevenue = (req, res, next) =>{
	try{
		let from = req.body['date_from[]'];
		let to = req.body['date_to[]'];
		let driver_id = req.body['driver_id[]'];
		let ad_id = req.body['ad_id[]'];
		let time_from = req.body['time_from[]'];
		let time_to = req.body['time_to[]'];
		let data= from+to+driver_id+ad_id+time_from+time_to;
		// console.log('datain'+ data);
		let with_time = [];
		let without_time = [];
		let single_array = [];
		let res_array =[];
		let status = false;
		let counter = 0;
		// console.log(time_from+'/'+time_to);
		// console.log(from+'/'+to);
		//--------------------------------------------//
		validateRequest(req, res);
		async.series({
			drivers: (callback) =>{
				Driver.find({}, (err, result)=>{
					callback(err, result);
				})
			},
			advertisements: (callback) =>{
				Advertisement.find({}, (err, result)=>{
					callback(err, result);
				})
			},
			contacts: (callback) => {
		        Contact.find({read: 'unread'}, (err, contact) => {
		          callback(err, contact);
		        }).sort({ _id : -1 });
	      	},
	      	subscribers: (callback) =>{
		        Track_email.find({}, (err, subscriber)=>{
		          callback(err, subscriber);
		        });
	      	},
	      	engageds: (callback) =>{
		        Track_engaging_ad.find({}, (err, count)=>{
		          callback(err, count);
		        });
	      	}			
		}, (err, results) =>{
			if(err) throw err;
			if(results){
				//-----------------------------------------------//
				if(from && to && driver_id && ad_id){
					if(typeof(from) != 'string'){
						for(let i =0; i < from.length; i++){
							if(from[i] == to[i]){
								if(typeof(time_from) == 'string' && typeof(time_to) == 'string'){
									with_time.push({
										driver_id		 : driver_id[i],
										advertisement_id  : ad_id[i],
										from 		 : from[i],
										to	 	 : to[i],
										time_from 		 : time_from,
										time_to		 	 : time_to }
									);
									// console.log('time_string' +with_time);
								}else{
									// console.log(i+'-'+time_from[i]+'/'+i+'-'+time_to[i])
									with_time.push({
										driver_id		 : driver_id[i],
										advertisement_id  : ad_id[i],
										from 		 :  from[i],
										to	 	 :  to[i],
										time_from 		 : time_from[i],
										time_to		 	 : time_to[i] }
									);
									// console.log('time_obj'+with_time);
								}	
							}else if(from[i] != to[i]){
								with_time.push({
									from	 			: from[i],
									to 					: to[i],
									driver_id 			: driver_id[i],
									advertisement_id 	: ad_id[i],
									time_from 			: '',
									time_to				: ''
									}
								
								);
								// console.log('time_obj'+with_time);
							}
						}
						// console.log('final array'+with_time);
						with_time.forEach((ad, index) =>{
							// console.log('single array'+JSON.stringify(ad));
							counter++;
							single_array = [];
							// console.log(ad.time_from +'/'+ad.time_to)
							if(ad.time_from && ad.time_to){
								single_array.push(
									{"driver_id" : ad.driver_id},
									{"advertisement_id" : ad.advertisement_id},
									{"play_date" :{$gte: new Date(ad.from)}},
									{"play_date" :{$lte: new Date(ad.to)}},
									{"play_time" :{$gte: timeToSec(ad.time_from)}},
									{"play_end_time" :{$lte: timeToSec(ad.time_to)}}
								);
							}else{
								single_array.push(
									{"driver_id" : ad.driver_id},
									{"advertisement_id" : ad.advertisement_id},
									{"play_date" :{$gte: new Date(ad.from)}},
									{"play_date" :{$lte: new Date(ad.to)}}
								);
							}
							//-------------------------------------------------//
							// console.log('single array'+JSON.stringify(single_array));
							Play_ad.find({$and:single_array})
							.populate({
								path: 'advertisement_id',
								model: 'Advertisement',
							}).populate({
								path: 'driver_id',
								model: 'Driver',
							}).exec((err, result) =>{
								// console.log(result);
								if(err){ 
									throw err;
									err = true;
								}
								let no =0;
								let stime =0;
								let etime =0;
								let duration = 0;
								let driver_id = '';
								let ad_name1 = '';
								let type1 = '';
								if(result){
									result.forEach((key) =>{
										stime+= key.play_time;
										etime+= key.play_end_time;
										type1  = key.advertisement_id.type;
										duration = key.advertisement_id.duration;
										driver_id = key.driver_id.driver_id;
										ad_name1  = key.advertisement_id.name;
									});
									// console.log(calculateNo(stime, etime, duration));
									if(driver_id && ad_name1 && type1){
										res_array.push({
											date_from : ad.from,
											date_to : ad.to,
											time_from : ad.time_from ? ad.time_from : '-',
											time_to : ad.time_to ? ad.time_to : '-',
											driver_id : driver_id,
											ad_name : ad_name1,
											type : type1,
											no : calculateNo(stime, etime, duration)
										});
									}else{
										res_array.push({
											date_from : ad.from,
											date_to : ad.to,
											time_from : ad.time_from ? ad.time_from : '-',
											time_to : ad.time_to ? ad.time_to : '-',
											driver_id : '-',
											ad_name : '-',
											type : '-',
											no : calculateNo(stime, etime, duration)
										});
									}
										
									
									// console.log(res_array)
									// console.log('index'+index+'length'+with_time.length);
									if(res_array.length == with_time.length){
										// console.log('En-index'+counter+'length'+with_time.length);
										return res.render('revenue',{
									 	advertisements: results.advertisements,
								        drivers: results.drivers,
								        contacts: results.contacts,
								        subscribers: results.subscribers,
								        engageds: results.engageds,
									 	revenueData: res_array,
									 	showData: true,
									 	session : req.session
									});
									res.end();	
									}
									
								}else{
									// console.log('e'+res_array)
									status = true;
									
									res.render('revenue',{
									 	advertisements: results.advertisements,
								        drivers: results.drivers,
								        contacts: results.contacts,
								        subscribers: results.subscribers,
								        engageds: results.engageds,
									 	revenueData: res_array,
									 	showData: false,
									 	session : req.session
									});
									res.end();
									return false;
								}
							});

							//-------------------------------------------------//
						});
						
					}else{
						
						// console.log(from+','+to+','+driver_id+','+ad_id+','+time_from+','+time_to)
						
						if(from != to){
							single_array.push(
									{"driver_id" : driver_id},
									{"advertisement_id" : ad_id},
									{"play_date" : {$gte: new Date(from)}},
									{"play_date" : {$lte: new Date(to)}}
								);
						}else if(from == to){
							// if(!time_from && !time_to){
							// 	req.session.sessionFlash = {
			    //                   	type: 'danger',
			    //                   	message: 'Please select Time!'
			    //               	};
							// }
							single_array.push(
									{"driver_id" : driver_id},
									{"advertisement_id" : ad_id},
									{"play_date" :{$gte: new Date(from)}},
									{"play_date" :{$lte: new Date(to)}},
									{"play_time" :{$gte: timeToSec(time_from)}},
									{"play_end_time" :{$lte: timeToSec(time_to)}}
								)
						}
						// console.log(single_array)
						Play_ad.find({$and:single_array})
						.populate({
							path: 'advertisement_id',
							model: 'Advertisement',
						}).populate({
							path: 'driver_id',
							model: 'Driver',
						}).exec((err, result) =>{
							// console.log(result);
							if(err) throw err;
							let no =0;
							let stime =0;
							let etime =0;
							let duration = 0;
							let driver_id = '';
							let ad_name1 = '';
							let type1 = '';
							if(!isEmpty(result)){
								result.forEach((key) =>{
									stime+= key.play_time;
									etime+= key.play_end_time;
									type1  = key.advertisement_id.type;
									duration = key.advertisement_id.duration;
									driver_id = key.driver_id.driver_id;
									ad_name1  = key.advertisement_id.name;
								});
								// console.log(calculateNo(stime, etime, duration));
								if(from != to){
									res_array.push({
										date_from : from,
										date_to : to,
										time_from : '-',
										time_to : '-',
										driver_id : driver_id,
										ad_name : ad_name1,
										type : type1,
										no : calculateNo(stime, etime, duration)
									});
								}else if(from == to){
									res_array.push({
										date_from : from,
										date_to : to,
										time_from : time_from ? time_from : '-',
										time_to : time_to ? time_to : '-',
										driver_id : driver_id,
										ad_name : ad_name1,
										type : type1,
										no : calculateNo(stime, etime, duration)
									});
								}
									
								// console.log(res_array)
								return res.render('revenue',{
								 	advertisements: results.advertisements,
							        drivers: results.drivers,
							        contacts: results.contacts,
							        subscribers: results.subscribers,
							        engageds: results.engageds,
								 	revenueData: res_array,
								 	showData: true,
								 	session : req.session
								});
								res.end();
							}else{
								return res.render('revenue',{
								 	advertisements: results.advertisements,
							        drivers: results.drivers,
							        contacts: results.contacts,
							        subscribers: results.subscribers,
							        engageds: results.engageds,
								 	revenueData: res_array,
								 	showData: true,
								 	session : req.session
								});
								res.end();
							}
						});
					}
				}else{

					return res.render('revenue', {
						advertisements: results.advertisements,
				        drivers: results.drivers,
				        contacts: results.contacts,
				        subscribers: results.subscribers,
				        engageds: results.engageds,
				        showData: false,
				        session : req.session
					})
					res.end();
				}

				//-----------------------------------------------//	
			}
		});	
	}catch(err){
		throw err;
	}
};

//downloadCsv
exports.downloadCsv = (req, res, next) =>{
	try{
		let htmlTable =req.body.data;
		csv = tableToCsv(htmlTable);
		let filename = Date.now().toString()+'.csv';
		let down_path = './assets/uploads/'+filename;
		fs.writeFile(down_path, csv, function(err) {
		  if (err) throw err;
		  return res.send(JSON.stringify({file : filename}));
		  res.end();
		});
	}catch(error){
		throw error;
	}
}
//download-file
exports.downloadFile = (req,res, next) =>{
	try{
		let file_name = req.params.name;
		// res.download('./assets/uploads/'+file_name);
			return res.download('./assets/uploads/'+file_name, function(err){
			  	if (err) {
			        throw err;
			      }
	      		fs.unlink('./assets/uploads/'+file_name, (err) => {
	        	if (err) {
		          	throw err;
		        }
	        // console.log('FILE [' + filename + '] REMOVED!');
	      });
	    });
			res.end();
	}catch(error){
		throw error;
	}
}
//test controller

exports.test = (req, res,next) =>{
	try{
		console.log(__dirname);
		// let absPath = path.join(__dirname, '/my_files/', filename);
		// let relPath = path.join('./my_files', filename);
		res.download('./assets/uploads/file-1513765120752.jpg');
	}catch(error){
		throw error;
	}
}