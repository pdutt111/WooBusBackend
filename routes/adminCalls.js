/**
 * Created by pariskshitdutt on 23/09/15.
 */
/**
 * Created by pariskshitdutt on 23/09/15.
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
var crypto=require('../authentication/crypto');
var usersLogic=require('../logic/Login');
var adminLogic=require('../logic/admin');

var userTable;
var pinTable;
userTable=db.getuserdef;
pinTable=db.getpindef;
//router.post('/pin',params({body:['phonenumber']}),function(req,res){
//    usersLogic.pinLogic(req,res)
//        .then(function(info){
//            res.json(config.get('ok'))
//        })
//        .catch(function(err){
//            res.status(err.status).json(err.message);
//        })
//});
/* GET users listing. */
router.get('/protected/info/routes',params({headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        adminLogic.verifyAdmin(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        adminLogic.getRoutes(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
router.get('/protected/info/route/:id',params({headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        adminLogic.verifyAdmin(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        adminLogic.getRoute(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
router.get('/protected/info/operators',params({query:['q'],headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        adminLogic.verifyAdmin(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        adminLogic.getOperators(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
router.get('/protected/info/admins',params({query:['q'],headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        adminLogic.verifyAdmin(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        adminLogic.getAdmins(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
router.post('/protected/info/operator/:id/approve',params({headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        adminLogic.verifyAdmin(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        adminLogic.approveOperator(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
router.get('/protected/info/unverifiedoperators',params({headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        adminLogic.verifyAdmin(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        adminLogic.getUnverifiedOperators(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
router.post('/protected/info/admin/:id/approve',params({headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        adminLogic.verifyAdmin(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        adminLogic.approveAdmin(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
router.get('/protected/info/unverifiedadmins',params({headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        adminLogic.verifyAdmin(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        adminLogic.getUnverifiedAdmins(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
router.get('/protected/info/buses',params({headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        adminLogic.verifyAdmin(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        adminLogic.getBuses(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
router.get('/protected/info/bus/:id',params({headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        adminLogic.verifyAdmin(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        adminLogic.getBus(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
router.patch('/protected/info/bus/:id',params({headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        adminLogic.verifyAdmin(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        adminLogic.patchBus(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
router.post('/protected/info/route',params({body:['start','end','boarding_points','distance',
    'time_taken','active','boarding_points','scheduled_stops'],headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        adminLogic.verifyAdmin(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
            .done();
    },
    function(req, res, next) {
        adminLogic.addRoutes(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
            .done();
    });
router.patch('/protected/info/route/:id',params({headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        adminLogic.verifyAdmin(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
            .done();
    },
    function(req, res, next) {
        adminLogic.patchRoutes(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
            .done();
    });
router.delete('/protected/info/route/:id',params({headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        adminLogic.verifyAdmin(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
            .done();
    },
    function(req, res, next) {
        adminLogic.deleteRoute(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
            .done();
    });
router.post('/protected/info/operator/:id/signin',params({headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next){
        adminLogic.signinoverride(req,res)
            .then(function(user){
                req.user=user;
                req.secret=false;
                next();
            }).catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req,res,next){
        usersLogic.sendToken(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    })
module.exports = router;
