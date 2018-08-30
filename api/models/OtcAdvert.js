/**
 * Created by hugh on 2018/6/26.
 *
 * OtcAdvert
 *
 * @description :: Server-side logic for managing $
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */


module.exports = {

  schema: true,
  tableName:"otc_advert",

  attributes: {
    id:          { type:  'integer',  primaryKey: true, autoIncrement: true},//主键
    owner:       { model: 'user'},   // 用户
    advert_type:          { type:  'integer',   size: 100},//广告类型 1：买单、2：卖单
    area_code:            { type:  'integer',   size: 100},//地区编码
    area_name :           { type:  'string',   size: 100},//地区名称
    legal_coin:           { type:  'integer',   size: 255},//法币编码
    legal_coin_name:      { type:  'string',   size: 255},//法币名称
    buy_price:	          { type:  'string',   size: 255},//购买价
    buy_price_unit:       { type:  'string',   size: 255},//购买价单位
    publish_number:       { type:  'string',   size: 255},//出售数量
    publish_number_unit:  { type:  'string',   size: 255},//出售数量单位
    surplus_number:       { type:  'string',   size: 255},//剩余数量
    transact_min:         { type:  'string',   size: 255},//交易最小限额
    transact_max:         { type:  'string',   size: 255},//交易最大限额
    transact_unit:        { type:  'string',   size: 255},//交易单位
    transact_open_stime:  { type:  'date'               },//交易开始时间
    transact_open_etime:  { type:  'date'               },//交易结束时间
    transact_deadline:    { type:  'string',   size: 255},//交易期限
    receiver_account:     { type:  'string',   size: 255},//收款账号
    is_auto:              { type:  'string',   size: 255},//是否自动回复
    reply_content:        { type:  'string',   size: 255},//回复内容
    issend:               { type:  'string',   size: 10} ,
    status:               { type:  'integer',  defaultsTo: 1} // 状态 0、关闭 1、使用中 2、隐藏
    }

};
