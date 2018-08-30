var amqp = require('amqplib');
var async= require('async');

amqp.connect('amqp:test:test@114.215.134.182:5672').then(
    function(conn)  {
    	var ok = conn.createChannel();
    	//console.log("ok===="+JSON.stringify(ok));
    	ok.then(function(ch){
    		//console.log("ch===="+JSON.stringify(ch));
    		//ch.assertQueue('orderdone', {durable: true});
    		//var queue = 'a'; var ex="aa";
    		//生产者
            //var msg = 'Hello10 World!';
            /*ch.assertExchange('exchange_normal','fanout'),
    		ch.assertQueue('queue_normal',{durable: true,messageTtl :30000,deadLetterExchange:'dead-ex',deadLetterRoutingKey :'black'});
    	    ch.bindQueue('queue_normal','exchange_normal','');

    		ch.assertExchange('dead-ex','direct');
    		ch.assertQueue('queue_dlx',{durable: true});
    		ch.bindQueue('queue_dlx','dead-ex','black');*/
    		//ch.sendToQueue(q, new Buffer(msg), {persistent: true});
    		//消费者
    		//ch.publish('exchange_normal','',new Buffer("5555555"));
    		//关闭广告 卖家关闭订单 订单成交 发送代币.......
			ch.consume('orderdone', function(msg) {
			  console.log("msg==="+JSON.stringify(msg));
			  var id=msg.content.toString();
			  OtcOrder.update({id:id},{status:4}).exec(function(){
			  	if(err){
			  		sails.log.error('发币失败');
			  		return;
			  	}
			  	if(result.length=0){
			  		sails.log.err('没有更新成功');
			  	}
			  });
			  console.log(" [x] Received %s", msg.content.toString());
			  ch.ack(msg);
			}, {noAck: false});  

    	});
    },
    (err) => {
        console.log("connection error")
    }
).catch(console.warn);