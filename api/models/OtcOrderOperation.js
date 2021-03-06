/**
 * Created by hugh on 2018/6/26.
 *
 * OtcOrderOperation
 *
 * @description :: Server-side logic for managing $
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */


module.exports = {

  schema: true,
  tableName:"otc_order_operation",

  attributes: {
    id:          { type:  'integer',  primaryKey: true, autoIncrement: true},//主键
    owner:       { model: 'user'},   // 用户
    owner_name:                 { type:  'string',   size: 255},//用户姓名
    transac_id:                 { type:  'string',   size: 100},//订单id
    operation_content:          { type:  'string',   size: 255},//操作内容
    transac_type :              { type:  'string',   size: 255},//类型，放币还是锁币
    transac_manner :            { type:  'string',   size: 255},//广告关闭 订单完成放币
    transac_hash :              { type:  'string',   size: 255},//放币的hash值
    remark :                    { type:  'string',   size: 255},//备注
    }

};
