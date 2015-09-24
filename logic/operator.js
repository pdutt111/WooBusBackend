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
var routesTable=db.getroutesdef;

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
    getBuses:function(req,res){
        var def= q.defer();
      busTable.find({user_id:req.user._id},"start end fare route discounts departure_time arrival_time distance " +
          "images boarding_points total_seats is_available").populate("route").exec()
          .then(function(buses){
              def.resolve(buses);
          })
          .then(null,function(err){
              def.reject({status:500,message:config.get('error.dberror')});
          })
        return def.promise;
    },
    getBus:function(req,res){
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
    getRoutes:function(req,res){
        var def= q.defer();
        routesTable.find({active:true},"start end boarding_points scheduled_stops distance" +
            "time_taken",function(err,rows){
            if(!err){
                def.resolve(rows);
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }

        })
        return def.promise;
    },
    addBus:function(req,res){
        var def= q.defer();
        req.body.user_id=req.user._id;
        req.body.seats=[];
        for(var i=1;i<=req.body.total_seats;i++){
            var window=false;
            if((i-1)%4==0||i%4==0){
                window=true;
            }
            req.body.seats.push({seat_no:i,is_window:true})
        }
        var bus=new busTable(req.body);
        bus.save(function(err,bus,info){
            if(!err){
                def.resolve(bus);
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        })
        return def.promise;
    },
    patchBus:function(req,res){
        var def= q.defer();
        req.body.user_id=req.user._id;
       busTable.update({bus_id:req.param.id,user_id:req.user._id},{$set:req.body},function(err,info){
           if(!err){
               def.resolve(config.get('ok'));
           }else{
               def.reject({status:500,message:config.get('error.dberror')});
           }
       })
        return def.promise;
    },
    addImages:function(req,res){
        var def= q.defer();
        console.log(req.files);
        busTable.update({bus_id:req.param.id,user_id:req.user._id},{$addToSet:{images:req.files.path}},function(err,info){
            if(!err){
                def.resolve(config.get('ok'));
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    }
}

module.exports=buses;