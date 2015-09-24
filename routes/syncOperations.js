/**
 * Created by pariskshitdutt on 15/09/15.
 */
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
var sync=require('../logic/localServerSyncing');
var userTable;
userTable=db.getuserdef;

router.post('/status',params({body:['bus_identifier','temperature','humidity','location','pi_time',
        'load_average','total_ram','ram_used','ram_used_process', 'upload_speed',
        'download_speed','users_connected','uptime'
        ,'speed','bearing']},{message : config.get('error.badrequest')}),
    function(req,res){
    sync.postStatus(req,res)
        .then(function(response){
            res.json(response)
        })
        .catch(function(err){
            res.status(err.status).json(err.message);
        });
    });

module.exports = router;
