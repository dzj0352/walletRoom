/**
 * IdImage.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  schema: true,

  attributes: {
    id:          {type: 'integer', primaryKey: true, autoIncrement: true},
    user:        {type: 'integer'},
    front:       {type: 'string', size: 128},//海报图片跳转链接
    back:        {type: 'string', size: 128}, // 海报图片地址
    hand:        {type: 'string', size: 128}, // 海报图片地址
    status:      {type: 'integer', defaultsTo: 0} // 0 未认证，1 已认证， 2 等待审核，3 认证失败
  }

};

