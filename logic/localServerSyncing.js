/**
 * Created by pariskshitdutt on 13/09/15.
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
var busLocationTable=db.getbuslocationdef;
var cachefiTable=db.getcachefidef;
var catalogTable=db.getcatalogdef;
var busLocationTable=db.getbuslocationdef;
var feedbackTable=db.getfeedbackdef;

var syncing={
    boxinit:function(req,res){
        var def= q.defer();
        var cachefi=new cachefiTable(req.body);
        cachefi.save(function(err,row,info){
           if(!err){
               def.resolve(row);
           }else{
               console.log(err);
               def.reject({status:500,message:config.get('error.dberror')});
           }
        });
        return def.promise;
    },
    addContent:function(req,res){
        var def= q.defer();
        var content=new catalogTable(req.body);
        content.save(function(err,row,info){
            if(!err){
                def.resolve(row);
            }else{
                console.log(err);
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    },
    postStatus:function(req,res){
        var def= q.defer();
        //req.body.location=[new Number(req.body.lon),new Number(req.body.lat)];
        req.body.ip=req.connection.remoteAddress;
        var buslocation=new busLocationTable(req.body);
        buslocation.save(function(err,entry,info){
            console.log(err,entry,info);
            if(!err){
                def.resolve(config.get('ok'));
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    },
    getMedia:function(req,res){
        var def= q.defer();
        cachefiTable.findOne({bus_identifier:req.query.bus_identifier},"media_load last_refresh").populate("media_load",
            "name description path content_type").exec()
            .then(function(row){
                def.resolve(row);
            })
            .then(null,function(err){
                def.reject({status:500,message:config.get('error.dberror')});
            });
        return def.promise;
    },
    syncdone:function(req,res){
        var def= q.defer();
        cachefiTable.update({bus_identifier:req.body.bus_identifier},{$set:{last_refresh:new Date()}}).exec()
            .then(function(row){
                def.resolve(config.get('ok'));
            })
            .then(null,function(err){
                def.reject({status:500,message:config.get('error.dberror')});
            });
        return def.promise;
    },
    journeyCompleted:function(req,res){
        var def= q.defer();
        busTable.update({_id:new ObjectId(req.body.id)},{$set:{is_completed:true}}).exec()
            .then(function(info){
                def.resolve(config.get('ok'));
            })
            .then(null,function(err){
                def.reject({status:500,message:config.get('error.dberror')});
            });
        return def.promise;
    },
    getRoute:function(req,res){
        var def= q.defer();
        busTable.findOne({bus_identifier:req.query.bus_identifier,in_booking:false,is_completed:false,is_deleted:false}
            ,"start end fare discounts departure_time " +
            " distance images total_seats discounted_price route bus_type seats in_transit in_booking is_completed")
            .sort({_id:-1})
            .populate("route","start end start_loc end_loc fare distance time_taken active scheduled_stops boarding_points")
            .exec()
            .then(function(bus){
                def.resolve(bus);
            })
            .then(null,function(err){
                def.reject({status:500,message:config.get('error.dberror')});
            })
        return def.promise;
    },
    syncUsers:function(req,res){
        var def= q.defer();
        def.resolve(config.get("ok"));
        try{
            userTable.collection.insert(req.body.users, {continueOnError:true}, function(err,info){
                log.warn(err);
            })
        }catch(e){}
        return def.promise;
    },
    sendFeedback:function(req,res){
        var def= q.defer();
        feedbackTable.collection.insert(req.body.feedbacks, {continueOnError:true}, function(err, rows) {
            if(!err||err.code==11000) {
                def.resolve();
            }
            else {
                def.reject({status: 500, message: config.get('error.dberror')});
            }
        });
        return def.promise;
    }
};

module.exports=syncing;