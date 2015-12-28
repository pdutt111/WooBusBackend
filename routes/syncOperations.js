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
router.post('/boxinit',params({body:['bus_identifier','media_load','local_language']},{message : config.get('error.badrequest')}),
    function(req,res){
        sync.boxinit(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            });
    });
router.post('/content',params({body:['name','description','language','path','content_type']},{message : config.get('error.badrequest')}),
    function(req,res){
        sync.addContent(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            });
    });

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
router.get('/media',params({query:['bus_identifier']},{message : config.get('error.badrequest')}),
    function(req,res){
        sync.getMedia(req,res)
            .then(function(response){
                res.json(response)
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            });
    });
router.post('/refreshed',params({body:['bus_identifier']},{message : config.get('error.badrequest')}),function(req,res){
    sync.syncdone(req,res)
        .then(function(response){
            res.json(response)
        })
        .catch(function(err){
            res.status(err.status).json(err.message);
        });
});
router.post('/journey/completed',params({body:['bus_identifier','id']},{message : config.get('error.badrequest')}),
    function(req,res,next){
        sync.journeyCompleted(req,res)
            .then(function(response){
                res.json(config.get("ok"));
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
    });
router.get('/route/get',params({query:['bus_identifier']},{message : config.get('error.badrequest')}),
    function(req,res){
        sync.getRoute(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
    });
router.post('/users',params({body:['bus_identifier','users']},{message : config.get('error.badrequest')}),
    function(req,res){
        log.info(req.body);
        sync.syncUsers(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            });
    });
router.post('/feedback',params({body:['bus_identifier','feedbacks']},{message : config.get('error.badrequest')}),
    function(req,res,next){
        sync.sendFeedback(req,res)
            .then(function(){
                res.json(config.get('ok'))
            }).catch(function(err){
                log.error(err);
                res.status(500).json(config.get('error.dberror'));
            });
    });
module.exports = router;
