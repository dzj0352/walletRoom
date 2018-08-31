var amqp = require('amqplib');
var async= require('async');

exports.orderDoneSendCoin=function(id,cb){
	var msg={publish_unit:"CNY"};
	async.waterfall([
		function(callback){
			//需要判断issend为空......
			OtcOrder.update({id:id,status:3},{status:4,issend:1}).exec(function(err,orderResult){
			  	if(err){
			  		sails.log.error('发币失败'+err);
			  		return callback('更新失败，发币失败');
			  	}
			  	console.log("orderResult==="+JSON.stringify(orderResult));
			  	if(orderResult.length==0){
			  		sails.log.error('没有更新成功');
			  		return callback('没有更新成功');
			  	}
				msg.transact_num=orderResult[0].transact_num;
			
			  	return callback(null,orderResult);
			});
		},function(orderResult,callback){
			User.findOne({id:orderResult[0].buyer}).exec(function(err,userResult){
				if(err){
					sails.log.error('查找用户失败'+err);
			  		return callback('查找用户失败');
				}
				if(!userResult){
					sails.log.error('没有这个用户');
			  		return callback('没有这个用户');
				}
				msg.publickey=userResult.publickey;
				return callback(null,true);
			});
		},function(arg,callback){
			SendCoin.sendCoin(msg,function(err,result){
				if(err){
					return callback(err);
				}
				return callback(null,result);
			});
		}],function(err,results){
				if(err){
					sails.log.error('订单完成放币失败'+err);
				}
				var otcOrderOperation={
						owner:'258258',
						owner_name:'资金系统',
						transac_type:'2',
						transac_id:id,
						transac_manner:'2',//订单完成放币
						transac_hash:results,
						operation_content:"系统放币成功"
				};
				OtcOrderOperation.create(otcOrderOperation).exec(function(err,result){
					if(err){
						return cb('记录操作日志出错:'+err);
					}
					return cb(null,true);
				});
		});
	
}
exports.closeAdvert=function(id,cb){
	var msg={publish_unit:"CNY"};
	async.waterfall([function(callback){
		//只能是卖单才发币....
		OtcAdvert.findOne({id:id,advert_type:2}).exec(function(err,advertResult){
			if(err){
				return callback('没有该广告单');
			}
			if(!advertResult){
				return callback('没有该广告单');
			}
			if(advertResult.issend){
				return callback('该广告单的代币已经发送成功');
			}
			//百分数不精确，得处理......
			msg.transact_num=advertResult.surplus_number/0.995;
			return callback(null,advertResult);
		});
	},function(advertResult,callback){
		User.findOne({id:advertResult.owner}).exec(function(err,userResult){
			if(err){
				sails.log.error('查找用户失败'+err);
		  		return callback('查找用户失败');
			}
			if(!userResult){
				sails.log.error('没有这个用户');
		  		return callback('没有这个用户');
			}
			msg.publickey=userResult.publickey;
			return callback(null,true);
		});
	},function(arg,callback){
		OtcAdvert.update({id:id},{issend:1}).exec(function(err,result){
			if(err){
				return callback('更新失败'+err);
			}
			//是否判断result......
			return callback(null,result);
		});
	},function(arg,callback){
		//发币之前先记录，发币结束后，再记录hash......
		//创建订单之前取消广告，订单发币了，广告退款也成功了......
		//应该创建订单之前先扣币......
		SendCoin.sendCoin(msg,function(err,result){
			if(err){
				return callback(err);
			}
			return callback(null,result);
		});
	}],function(err,result){
		if(err){
			return cb(err);
		}
		var otcOrderOperation={
				owner:'258258',
				owner_name:'资金系统',
				transac_type:'2',
				transac_id:id,
				transac_manner:'1',//广告关闭 退币
				transac_hash:result,
				operation_content:"系统放币成功"
		};
		OtcOrderOperation.create(otcOrderOperation).exec(function(err,result){
			if(err){
				return cb('记录操作日志出错:'+err);
			}
			return cb(null,true);
		});
	});
	
}
exports.orderCancelSendCoin=function(id,cb){
	var msg={publish_unit:"CNY"};
	async.waterfall([
		function(callback){
			OtcOrder.findOne({id:id,trasact_type:'2',status:[0,6]}).exec(function(err,orderResult){
				if(err){
					return callback('find order fail:'+err);
				}
				if(!orderResult){
					return callback('没有该订单信息');	
				}
				if(orderResult.issend==1){
					return callback('该订单已经放币完成');
				}
				msg.transact_num=Number(orderResult.transact_num*1.005).toFixed(2);
				return callback(null,orderResult);

			});
		},function(orderResult,callback){
			User.findOne({id:orderResult.buyer}).exec(function(err,userResult){
				if(err){
					sails.log.error('查找用户失败'+err);
			  		return callback('查找用户失败');
				}
				if(!userResult){
					sails.log.error('没有这个用户');
			  		return callback('没有这个用户');
				}
				msg.publickey=userResult.publickey;
				return callback(null,true);
			});
		},function(arg,callback){
			//需要判断issend为空......
			OtcOrder.update({id:id,status:[0,6]},{issend:1}).exec(function(err,result){
			  	if(err){
			  		sails.log.error('发币失败'+err);
			  		return callback('更新失败，发币失败');
			  	}
			  	if(result.length==0){
			  		sails.log.error('没有更新成功');
			  		return callback('没有更新成功');
			  	}
			  	
			  	return callback(null,true);
			});
		},function(arg,callback){
			SendCoin.sendCoin(msg,function(err,result){
				if(err){
					return callback(err);
				}
				return callback(null,result);
			});
		}],function(err,results){
				if(err){
					sails.log.error('订单完成放币失败'+err);
					return cb(err);
				}
				var otcOrderOperation={
						owner:'258258',
						owner_name:'资金系统',
						transac_type:'2',
						transac_id:id,
						transac_manner:'3',//订单取消 放币
						transac_hash:results,
						operation_content:"系统放币成功"
				};
				OtcOrderOperation.create(otcOrderOperation).exec(function(err,result){
					if(err){
						return cb('记录操作日志出错:'+err);
					}
					return cb(null,true);
				});
		});
	
}
exports.sendCoin=function(msg,callback){
	//还需要查询有没有发送过这一笔.......,需要新建一个表
	var issuer = '';
    if ('CNY' !== 'SWT') {
      issuer = 'jBciDE8Q3uJjf111VeiUNM775AMKHEbBLS';
    }
	var wallet={address:"jsyPuB9gQspKHir2WL3QUtcSKTk7gotDYd",secret:"snz23PhMkjForjgfUppJmNNLmi9os"};
	var payment={destination_account:msg.publickey,
		destination_amount:{
        "value": msg.transact_num,//出售的数量
        "currency":msg.publish_unit,//出售数量的单位
        "issuer": issuer
        }};
	ApiRequest.submitPayment(wallet,payment,1,false,function(err,payResult){
		if(err){
			sails.log.error('otcOrder freeze sell fail:'+err);
			return callback("err:"+err);
		}
		return callback(null,payResult.tx_json.hash);
	});
}
