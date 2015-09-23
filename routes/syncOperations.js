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

router.post('/status',params({body:['bus_id','temperature','humidity','lat','lon','time',
        'load_average','ram_used','ram_used_process', 'upload_speed',
        'download_speed','users_connected','uptime','cpu_model','cpu_speed','cpu_count',
        'total_ram','speed','bearing']},{message : config.get('error.badrequest')}),
    function(req,res){
    sync.postStatus(req,res)
        .then(function(response){
            next();
        })
        .catch(function(err){
            next();
        });
    },
    function(req,res){
        sync.getRoute(req,res)
            .then(function(bus){
                res.json(bus);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            });
    });


module.exports = router;
