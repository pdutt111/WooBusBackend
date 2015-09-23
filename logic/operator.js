/**
 * Created by pariskshitdutt on 07/09/15.
 */
/**
 * Created by pariskshitdutt on 04/09/15.
 */
var q= require('q');
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

var userTable=db.getuserdef;
var busTable=db.getbusdef;

var buses={
    verifyOperator:function(req,res){
      var def= q.defer();
        if(req.user.is_operator){
            def.resolve()
        }else{
            def.reject({status:401,message:config.get('error.unauthorized')});
        }
        return def.promise;
    },
    getbuses:function(req,res){
        var def= q.defer();
      busTable.find({user_id:req.user._id},"start end fare discounts departure_time arrival_time distance images boarding_points total_seats is_available").exec()
          .then(function(buses){
              def.resolve(buses);
          })
          .then(null,function(err){
              def.reject({status:500,message:config.get('error.dberror')});
          })
        return def.promise;
    },
    getbus:function(req,res){
        var def= q.defer();
        busTable.findOne({user_id:req.user._id,_id:req.param.id},"start end fare discounts departure_time arrival_time" +
            " distance images boarding_points total_seats seats in_transit in_booking is_completed").exec()
            .then(function(bus){
                def.resolve(bus);
            })
            .then(null,function(err){
                def.reject({status:500,message:config.get('error.unauthorized')});
            })
        return def.promise;
    },
    addBus:function(req,res){
        var def= q.defer();
        req.body.user_id=req.user._id;
        var bus=new busTable(req.body);
        bus.save().then(function(info){
            def.resolve();
        }).then(null,function(err){
            def.reject({status:500,message:config.get('error.dberror')});

        })
        return def.promise;
    }
}

module.exports=buses;