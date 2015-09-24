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
var bookinglogic=require('../logic/bookings');
var userTable;
  userTable=db.getuserdef;
router.get('/protected/autocomplete',params({query:['q'],headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next){
      bookinglogic.cityAutoSuggest(req,res)
          .then(function(cities){
            res.json(cities);
          })
          .catch(function(err){
            res.status(err.status).json(err.message);
          })
    });
router.get('/protected/buses',params({query:['start','end'],headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next){
      bookinglogic.getBuses(req,res)
          .then(function(cities){
            res.json(cities);
          })
          .catch(function(err){
            res.status(err.status).json(err.message);
          })
    });
router.post('/protected/book',params({body:['bus_id','amount','seat_no'],headers:['authorization']},{message : config.get('error.badrequest')}),
    function(req,res,next){
      bookinglogic.bookbus.bookingsTableEntry(req,res)
          .then(function(booking){
            req.booking=booking;
            next();
          })
          .catch(function(err){
            res.status(err.status).json(err.message);
          })
    },
    function(req,res,next){
      bookinglogic.bookbus.busTableEntry(req,res)
          .then(function(result){
            next();
          })
          .catch(function(err){
            res.status(err.status).json(err.message);
          })
    },
    function(req,res){
      bookinglogic.bookbus.bookingsTableConfirm(req,res)
          .then(function(result){
            res.json(req.booking);
          })
          .catch(function(err){
            res.status(err.status).json(err.message);
          });
    });

module.exports = router;
