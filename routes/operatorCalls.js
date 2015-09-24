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
var path  = require('path');
var db=require('../db/DbSchema');
var events = require('../events');
var log = require('tracer').colorConsole(config.get('log'));
var apn=require('../notificationSenders/apnsender');
var gcm=require('../notificationSenders/gcmsender');
var crypto=require('../authentication/crypto');
var multer  = require('multer');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    }
})
var upload = multer({
    limits:{fileSize:"10Kb"},
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (path.extname(file.originalname) !== '.jpg') {
            return cb(new Error('Only jpgs are allowed'))
        }
        cb(null, true)
    }
})

var operatorLogic=require('../logic/operator');

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
        operatorLogic.verifyOperator(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        operatorLogic.getRoutes(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
router.get('/protected/info/buses',params({headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        operatorLogic.verifyOperator(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        operatorLogic.getBuses(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
router.get('/protected/info/bus/:id',params({headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        operatorLogic.verifyOperator(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        operatorLogic.getBus(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
router.post('/protected/info/bus',params({body:['start','end','bus_identifier','fare','departure_time','arrival_time','route','total_seats'],headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        operatorLogic.verifyOperator(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        operatorLogic.addBus(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
router.patch('/protected/info/bus/:id',params({headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        operatorLogic.verifyOperator(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        operatorLogic.patchBus(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
router.post('/protected/info/bus/:id/images',upload.array('photos', 12),params({headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next) {
        console.log(req.files);
        operatorLogic.verifyOperator(req,res)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        operatorLogic.addImages(req,res)
            .then(function(response){
                res.json(response);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            }).done();
    });
module.exports = router;
