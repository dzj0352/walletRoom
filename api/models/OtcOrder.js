/**
 * Created by hugh on 2018/6/26.
 *
 * OtcOrder
 *
 * @description :: Server-side logic for managing $
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */


module.exports = {

  schema: true,
  tableName:"otc_order",

  attributes: {
    id:          { type:  'integer',  primaryKey: true, autoIncrement: true},//主键
    owner:       { model: 'user'},   // 用户
    advert:                     { type:  'string',   size: 255},//广告单
    order_no:                   { type:  'string',   size: 100},//订单编号
    transact_price:             { type:  'integer',   size: 100},//交易价格
    transact_price_unit :       { type:  'string',   size: 255},//交易价格单位
    transact_amount:            { type:  'integer',   size: 100},//交易金额
    transact_amount_unit :      { type:  'string',   size: 255},//交易金额单位
    transact_num:               { type:  'integer',   size: 255},//交易数量
    transact_num_unit:          { type:  'string',   size: 255},//交易数量单位
    payment_remark:	            { type:  'string',   size: 255},//付款备注
    trasact_type:               { type:  'string',   size: 255},//交易类型：购买单、出售单
    buyer:                      { model: 'user'},   // 买家
    seller:                     { model: 'user'},   // 卖家
    cancel_reason:              { type:  'string',   size:1000},//订单取消原因
    issend:                     { type:  'string',   size: 10} ,
    status:                     { type:  'integer',  defaultsTo: 1} 
        // 状态 1、提交订单 2、买家付款完成 3、卖家放币 4、订单完成,系统放币 0、订单取消
        // 5 订单自动取消 6、管理员取消
    }

};
