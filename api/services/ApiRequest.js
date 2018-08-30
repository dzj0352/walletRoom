const _ = require('lodash');
const jutil = require('jingtum-lib').utils;
var BigNumber = require('bignumber.js');

function parseCurrencyAmount(currencyAmount) {
  if (typeof currencyAmount === 'string') {
    return {
      currency: 'SWT',
      counterparty: '',
      value: new BigNumber(currencyAmount).dividedBy(1000000.0).toNumber()
    };
  } else {
    return {
      currency: currencyAmount.currency,
      counterparty: currencyAmount.issuer,
      value: currencyAmount.value
    };
  }
}

function process_balance(data) {
  var swt_value = new BigNumber(data.native.account_data.Balance).dividedBy(1000000.0).toNumber();
  var freeze0 = sails.config.freezed.reserved
    + (data.lines.lines.length + data.orders.offers.length) * sails.config.freezed.each_freezed;
  var _data = [{value: swt_value + '', currency: 'SWT', issuer: '', freezed: freeze0 + ''}];
  for (var i = 0; i < data.lines.lines.length; ++i) {
    var item = data.lines.lines[i];
    var tmpBal = {value: item.balance, currency: item.currency, issuer: item.account, freezed: '0'};
    var freezed = 0;
    data.orders.offers.forEach(function (off) {
      var taker_gets = jutil.parseAmount(off.taker_gets);
      if (taker_gets.currency === _data[i].currency && taker_gets.issuer === _data[i].issuer && taker_gets.currency === 'SWT') {
        var tmpFreezed = parseFloat(_data[i].freezed) + parseFloat(taker_gets.value);
        _data[i].freezed = tmpFreezed + '';
      } else if (taker_gets.currency === tmpBal.currency && taker_gets.issuer === tmpBal.issuer) {
        freezed += parseFloat(taker_gets.value);
      }
    });
    tmpBal.freezed = new BigNumber(tmpBal.freezed).plus(freezed).toFixed(10);

    _data.push(tmpBal);
  }
  return _data;
}

exports.getBalance = function (address, options, callback) {
  var remote = sails.remote;
  if (!remote || !remote.isConnected()) {
    sails.log.error('remote is disconnected');
    return callback(null, []);
  }
  var options = {account: address, type: 'trust'};
  async.parallel({
    native: function (callback) {
      var req1 = remote.requestAccountInfo(options);
      req1.submit(callback);
    },
    lines: function (callback) {
      var req2 = remote.requestAccountRelations(options);
      req2.submit(callback);
    },
    orders: function (callback) {
      var req3 = remote.requestAccountOffers(options);
      req3.submit(callback);
    }

  }, function (err, results) {
    if (err) {
    //  sails.log.error('fail to get balance: ' + err);
      return callback(null, []);
    }
    return callback(null, process_balance(results));
  });
};

exports.submitPayment = function (wallet, payment, client_id, validated, callback) {
  var remote = sails.remote;
  if (!remote || !remote.isConnected()) {
    return callback('server is disconnected');
  }
  var to = payment.destination_account;
  var amount = payment.destination_amount;
  var tx = remote.buildPaymentTx({account: wallet.address, to: to, amount: amount});
  if (payment.memos) {
    // add memo
    tx.addMemo(payment.memos);
  }
  tx.setSecret(wallet.secret);
  tx.submit(function (err, result) {
    if (err) {
      return callback('fail to payment: ' + err);
    }
    result.success = result.engine_result === 'tesSUCCESS';
    result.client_id = client_id;
    callback(null, result);
  });
};

exports.addBlacklist = function (wallet, black, callback) {
  var remote = sails.remote;
  if (!remote || !remote.isConnected()) {
    return callback('server is disconnected');
  }

  var req = remote.setBlackList({account: wallet.address, black: black});
  req.setSecret(wallet.secret);

  req.submit(function(err, result) {
    if(err) {console.log('err:',err);}

    callback(null, result);
  });

};

exports.removeBlacklist = function (wallet, black, callback) {
  var remote = sails.remote;
  if (!remote || !remote.isConnected()) {
    return callback('server is disconnected');
  }

  var req = remote.removeBlackList({account: wallet.address, black: black});
  req.setSecret(wallet.secret);

  req.submit(function(err, result) {
    if(err) {console.log('err:',err);}

    callback(null, result);
  });

};


exports.createOrder = function (wallet, order, validated, callback) {
  var remote = sails.remote;
  if (!remote || !remote.isConnected()) {
    return callback('server is disconnected');
  }
  var pays = {
    value: order.taker_pays.value, currency: order.taker_pays.currency,
    issuer: order.taker_pays.counterparty ? order.taker_pays.counterparty : ''
  };
  var gets = {
    value: order.taker_gets.value, currency: order.taker_gets.currency,
    issuer: order.taker_gets.counterparty ? order.taker_gets.counterparty : ''
  };
  var tx = remote.buildOfferCreateTx({
    type: _.capitalize(order.type),
    source: wallet.address, taker_pays: pays, taker_gets: gets
  });
  tx.setSecret(wallet.secret);
  tx.submit(function (err, result) {
    if (err) {
      return callback('fail to create order: ' + err);
    }
    callback(null, result);
  });
};

exports.cancelOrder = function (wallet, sequence, validated, callback) {
  var remote = sails.remote;
  if (!remote || !remote.isConnected()) {
    return callback('server is disconnected');
  }
  var tx = remote.buildOfferCancelTx({source: wallet.address, sequence: sequence});
  tx.setSecret(wallet.secret);
  tx.submit(function (err, result) {
    if (err) {
      return callback('fail to cancel offer: ' + sequence);
    }
    callback(null, result);
  });
};

function process_order_list(orders) {
  var _results = [];
  for (var i = 0; i < orders.length; ++i) {
    var order = orders[i];
    var _order = {};
    _order.type = order.flags === 0x00020000 ? 'sell' : 'buy';
    var base = (_order.type === 'sell' ? order.taker_gets : order.taker_pays);
    base = jutil.parseAmount(base);
    var counter = (_order.type === 'sell' ? order.taker_pays : order.taker_gets);
    counter = jutil.parseAmount(counter);
    _order.pair = base.currency + (base.issuer ? '+' + base.issuer : '') +
      '/' + counter.currency + (counter.issuer ? '+' + counter.issuer : '');
    _order.price =new BigNumber(counter.value).dividedBy(base.value).toFixed(10);
    _order.amount = new BigNumber(base.value).toFixed(10);
    _order.sequence = order.seq;
    _order.currency = base.currency + '/' + counter.currency;

    _results.push(_order);
  }
  return _results;
};
exports.getTransactionListV4 = function (address, options, currency,callback) {
  var remote = sails.remote;
  if (!remote || !remote.isConnected()) {
    return callback('server is disconnected');
  }
  var _options = {account: address, limit: options.results_per_page};
  if (options.marker) {
    _options.marker = options.marker;
  }
  var _request = remote.requestAccountTx(_options);
  _request.submit(function (err, result) {
    if (err) {
      sails.log.error('fail to get tx for address: ' + address);
      return callback('fail to get tx for address: ' + address);
    }
    //判断记录中是否有这个货币，没有就再次查，直到返回数据为止
    var reg='\"currency\":\"'+currency+'\"';
    if(JSON.stringify(result).indexOf(reg)!=-1){
         //console.log('====================');
         callback(null, result);
    }else{
      options.marker = result.marker;
      //console.log('----------------------------'+JSON.stringify(options.marker));
      return ApiRequest.getTransactionListV4(address, options,currency);
    }
  });
};
exports.getOrderList = function (address, options, callback) {
  var remote = sails.remote;
  if (!remote || !remote.isConnected()) {
    return callback('server is disconnected');
  }
  var options = {account: address, ledger: 'closed'};
  var _request = remote.requestAccountOffers(options);
  _request.submit(function (err, result) {
    if (err) {
      sails.log.error('fail to get order list:'+err);
      return callback(null, []);
    }
    return callback(null, process_order_list(result.offers));
  });
};


exports.getTransactionList = function (address, options, callback) {
  var remote = sails.remote;
  if (!remote || !remote.isConnected()) {
    return callback('server is disconnected');
  }
  var _options = {account: address, limit: options.results_per_page};
  if (options.marker) {
    _options.marker = options.marker;
  }
  var _request = remote.requestAccountTx(_options);
  _request.submit(function (err, result) {
    if (err) {
      sails.log.error('fail to get tx for address: ' + address);
      return callback('fail to get tx for address: ' + address);
    }
    callback(null, result);
  });
};

function process_orderbook_item(items, sell) {
  for (var i = 0; i < items.length; ++i) {
    var item = items[i];

    if (sell) {
      item.price =parseFloat(new BigNumber(item.price.value).toFixed(10));  // 卖(ask, true) 进最后一位
      item.amount = parseFloat(item.taker_gets_funded.value);
      item.total = parseFloat(item.taker_gets_total.value);
    } else {
      item.price = parseFloat(new BigNumber(item.price.value).toFixed(10));// 买(bid, flase) 舍最后一位
      item.amount = parseFloat(item.taker_pays_funded.value);
      item.total = parseFloat(item.taker_pays_total.value);
    }
    item.type = item.sell ? 'sell' : 'buy';
    delete item.sell;
    delete item.taker_pays_funded;
    delete item.taker_pays_total;
    delete item.taker_gets_funded;
    delete item.taker_gets_total;
  }
}

function mergePrice(items) {
  var res = {};
  var result = [];
  var totalValue = 0;
  for (var i = 0; i < items.length; ++i) {
    if (res[items[i].price]) {
      res[items[i].price].amount += items[i].amount;
    } else {
      res[items[i].price] = items[i];
      result.push(res[items[i].price])
    }
    delete res[items[i].price].order_maker;
    delete res[items[i].price].sequence;
    delete res[items[i].price].passive;
    totalValue += items[i].amount;
    res[items[i].price].total = totalValue;
  }
  return result;
}

function parseOrderBook(offers, isAsk) {
  var orderbook = [];
  for (var i = 0; i < offers.length; ++i) {
    var off = offers[i];

    var order_maker = off.Account;
    var sequence = off.Sequence;
    var passive = off.Flags === 0x00010000;
    var sell = off.Flags === 0x00020000;

    var taker_gets_total = jutil.parseAmount(off.TakerGets);
    var taker_gets_funded = off.taker_gets_funded ? jutil.parseAmount(off.taker_gets_funded) : taker_gets_total;

    var taker_pays_total = jutil.parseAmount(off.TakerPays);
    var taker_pays_funded = off.taker_pays_funded ? jutil.parseAmount(off.taker_pays_funded) : taker_pays_total;

    if (isAsk) {
      price = {
        currency: taker_pays_total.currency,
        issuer: taker_pays_total.issuer,
        value: new BigNumber(taker_pays_total.value).dividedBy(taker_gets_total.value).toNumber()
      };
    } else {
      price = {
        currency: taker_gets_total.currency,
        issuer: taker_gets_total.issuer,
        value: new BigNumber(taker_gets_total.value).dividedBy(taker_pays_total.value).toNumber()
      };
    }

    price.value = price.value.toString();

    orderbook.push({
      price: price,
      taker_gets_funded: taker_gets_funded,
      taker_gets_total: taker_gets_total,
      taker_pays_funded: taker_pays_funded,
      taker_pays_total: taker_pays_total,
      order_maker: order_maker,
      sequence: sequence,
      passive: passive,
      sell: sell
    });
  }
  return orderbook;
}

var BOOK_LIMIT = 30;
function loadOrderBook(remote, taker, base, counter, callback) {
  var options = {gets: base, pays: counter, taker: taker, limit: BOOK_LIMIT};
  var _request = remote.requestOrderBook(options);
  _request.submit(callback);
}
exports.loadOrderBook =loadOrderBook;
  exports.getOrderBook = function (address, base, counter, callback) {
  var remote = sails.remote;
  if (!remote || !remote.isConnected()) {
    return callback('server is disconnected');
  }
  var _base = base.currency + (base.issuer ? '+' + base.issuer : '');
  var _counter = counter.currency + (counter.issuer ? '+' + counter.issuer : '');

  async.parallel([function (done) {
    sails.bid_limit = sails.bid_limit || BOOK_LIMIT;
    loadOrderBook(remote, address, base, counter, done, sails.bid_limit);
  }, function (done) {
    sails.ask_limit = sails.ask_limit || BOOK_LIMIT;
    loadOrderBook(remote, address, counter, base, done, sails.ask_limit);
  }], function (err, results) {
    if (err) {
      sails.log.error('fail to get order book ');
      return callback(null, {base: _base, counter: _counter, bids: [], asks: []});
    }
    var bids = parseOrderBook(results[0].offers);
    process_orderbook_item(bids, false);
    bids.sort(sortbids);
    bids = mergePrice(bids); // 卖
    if (bids.length > 6) {
      sails.bid_limit -= 5;
    } else {
      sails.bid_limit += 5;
    }
    var asks = parseOrderBook(results[1].offers, true);
    process_orderbook_item(asks, true);
    asks.sort(sortAsks);
    asks = mergePrice(asks);// 买
    if (asks.length > 6) {
      sails.ask_limit -= 5;
      sails.ask_limit += 5;
    }
    callback(null, {base: _base, counter: _counter, bids: bids, asks: asks});
  });

};

function sortAsks(a, b){
  return a.price - b.price;
}

function sortbids(a, b){
  return b.price - a.price;
}

//获得信任额度
exports.getLimit = function (address, callback) {
  var remote = sails.remote;
  if (!remote || !remote.isConnected()) {
    return callback('server is disconnected');
  }

  var tx = remote.requestAccountRelations({
    type: 'trust',
    account: address
  });

  tx.submit(function (err, result) {
    if (err) {
      return callback('fail to get limit: ' + err);
    }
    callback(null, result);
  });
};

//设置信任额度
exports.setLimit = function (wallet, amount, callback) {
  var remote = sails.remote;
  if (!remote || !remote.isConnected()) {
    return callback('server is disconnected');
  }
  if(!amount || !jutil.isValidAmount(amount)){
    return callback('invalid amount');
  }
  var tx = remote.buildRelationTx({
    account: wallet.address,
    limit: amount,
    type: 'trust'
  });
  tx.setSecret(wallet.secret);
  tx.submit(function (err, result) {
    if (err) {
      return callback('fail to set limit: ' + err);
    }
    callback(null, result);
  });
};
