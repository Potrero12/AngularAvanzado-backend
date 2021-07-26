'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema({
	//id: String,
	name: String,
	surname: String,
	email: String,
	password: String,
	image: String,
	role: String
});

module.exports = mongoose.model('User', UserSchema);

