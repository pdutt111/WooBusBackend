var express = require('express');
var router = express.Router();
var params = require('parameters-middleware');
var config= require('config');
var jwt = require('jwt-simple');
var ObjectId = require('mongoose').Types.ObjectId;
var moment= require('moment');
var async= require('async');
var db=require('../db/DbSchema');
var events = require('../events');
var log = require('tracer').colorConsole(config.get('log'));
var apn=require('../notificationSenders/apnsender');
var gcm=require('../notificationSenders/gcmsender');
var userTable;
  userTable=db.getuserdef;
router.post('/protected/info/create',params({query:['start','end','fare','discount',]},{message : config.get('error.badrequest')}),function(req,res){

});


module.exports = router;
