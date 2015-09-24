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

var syncing={
    getRoute:function(req,res){
        var def= q.defer();
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate()+1);
        tomorrow.setTime(0,0,0,0);
        busTable.findOne({bus_identifier:req.query.bus_id,is_completed:false,departure_time:{$lt:tomorrow}},"start end scheduled_stops media_update " +
            "departure_time arrival_time distance boarding_points").populate("scheduled_stops.stop").exec()
            .then(function(bus){
                def.resolve(bus);
            })
            .then(null,function(err){
                def.reject({status:500,message:config.get('error.dberror')});
            })
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
    }
};

module.exports=syncing;