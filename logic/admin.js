/**
 * Created by pariskshitdutt on 23/09/15.
 */
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

var functions={
    verifyAdmin:function(req,res){
        var def= q.defer();
        if(req.user.is_admin){
            def.resolve()
        }else{
            def.reject({status:401,message:config.get('error.unauthorized')});
        }
        return def.promise;
    },
    getOperators:function(req,res){
        var def= q.defer();
        if(typeof req.query.q) {
            var re = new RegExp("" + req.query.q + "", 'i');
            userTable.find({name: {$regex: re}, is_operator: true}, "_id name email phonenumber is_verified address")
                .exec()
                .then(function (rows) {
                    def.resolve(rows);
                })
                .then(null,function(err){
                    def.reject({status:500,message:config.get('error.dberror')});
                });
        }
        return def.promise;
    },
    getBuses:function(req,res){
        var def= q.defer();
        busTable.find({user_id:req.query.operator_id},"start end fare discounts departure_time arrival_time distance images boarding_points total_seats is_available").exec()
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
        busTable.findOne({_id:req.param.id},"start end fare discounts departure_time arrival_time" +
            " distance images boarding_points total_seats seats in_transit in_booking is_completed").exec()
            .then(function(bus){
                def.resolve(bus);
            })
            .then(null,function(err){
                def.reject({status:500,message:config.get('error.unauthorized')});
            })
        return def.promise;
    },
    patchBus:function(req,res){
        var def= q.defer();
        busTable.update({_id:req.param.id},{$set:req.body},function(err,info){
            if(!err){
                def.resolve(config.get('ok'));
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
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
    addRoutes:function(req,res){
        var def= q.defer();
       var route=new routesTable(req.body);
        route.save(function(err,route,info){
            if(!err){
                def.resolve(route);
            }else{
                log.error(err);
                if(err.code=11000){
                    def.reject({status:400,message:config.get('error.exists')});
                }else{
                    def.reject({status:500,message:config.get('error.dberror')});
                }
            }
        });
        return def.promise;
    },
    patchRoutes:function(req,res){
        var def= q.defer();
        routesTable.update({_id:req.param.id},{$set:req.body},function(err,info){
            if(!err){
                def.resolve(config.get('ok'));
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    }
}

module.exports=functions;