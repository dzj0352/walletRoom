/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var User = {
  schema: true,

  attributes: {
    id:        { type: 'integer', primaryKey: true, autoIncrement: true },
    username:  { type: 'string', size: 64, unique: true, required: true},  // 用户名
    account:   { type: 'string', size: 64, unique: true},  // 用户名Hash

    nickname:  { type: 'string',  size: 16},  // 昵称
    remark:    { type: 'string',  size: 256, defaultsTo: ''},
    avatar:    { type: 'string',  size: 512},  // 头像URL
    active:    { type: 'boolean', defaultsTo: false },  // 是否是激活状态
    verified:  { type: 'integer', defaultsTo: 0 },  // 是否已经实名验证 0 未认证，1 已认证， 2 等待审核 3 认证失败
    verifiedWd:{ type: 'integer', defaultsTo: 0 },  // 提现时是否需要提交身份信息 0 未认证  1 已认证 2 等待审核 3 认证失败
    email:     { type: 'email'},
    //token:     {      type: 'string'  },

    realname:  { type: 'string',  size: 32, defaultsTo: ''}, //  真实姓名
    sex:       { type: 'integer', defaultsTo: 0 },  //  性别
    nation:    { type: 'string', defaultsTo: '中国'},  // 国家
    id_type:   { type: 'integer', defaultsTo: 0},  // 证类型 0身份证 1护照 99其他
    identity:  { type: 'string',  size: 32   },   // 身份证
    bankNo:  { type: 'string'  },   // 实名验证银行卡好
    address:   { type: 'string',  size: 26   },   // 所在地址
    idImageUrl:{ model: 'idimage'},   // 身份证url
     // 手机以及区号
    areacode:  { type: 'string' ,size: 20, defaultsTo: ''},
    phone:     { type: 'string', size:16},
    channelId:  { type: 'string' ,size: 80, defaultsTo: ''}, //渠道id
    bankPhone:     { type: 'string', size:20, defaultsTo: ''},//实名认证银行卡手机号

    publickey: { type: 'string',  size: 40   }, // 井通地址
    secret:    { type: 'text'          }, // 加密的私钥
    ppwd:      { type: 'string', defaultsTo: ''}, // 支付密码Hash

    contacts:  { collection: 'contact', via: 'owner' },
    //banks:     { collection: 'bank', via: 'owner' },

    foreigner: { type: 'boolean', defaultsTo: false    },
    upgraded:  { type: 'boolean', defaultsTo: true   },
    ip:  { type: 'string'  },
    sessionID: { type: 'string',  size: 64}
  }
};

module.exports = User;
