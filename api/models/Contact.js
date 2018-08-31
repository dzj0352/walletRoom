/**
* Contact.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var Contact = {
	schema: true,

	attributes: {
		id:                  { type: 'integer', primaryKey: true, autoIncrement: true },
		owner:               { model: 'user' },
		counterparty:        { model: 'user' },
		remark:              { type: 'string', size: 64, defaultsTo: '' }
	}
};

module.exports = Contact;
