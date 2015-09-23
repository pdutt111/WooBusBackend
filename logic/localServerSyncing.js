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
        var buslocation=new busLocationTable({bus_identifier:req.body.bus_id,temperature:req.body.temperature,humidity:
            req.body.humidity,location:[req.body.lon,req.body.lat],pi_time:new Date(req.body.time),
            load_average:req.body.load_average,ram_used:req.body.ram_used,ip:req.connection.remoteAddress,total_mem:req.body.total_ram,
            ram_used_process:req.body.ram_used_process,upload_speed:req.body.upload_speed,download_speed:req.body.download_speed,
            uptime:req.body.uptime,'cpus.model':req.body.cpu_model,'cpus.speed':req.body.cpu_speed,'cpus.count':req.body.cpu_count,
            users_connected:req.body.users_connected,speed:req.body.speed,bearing:req.body.bearing});
        buslocation.save()
            .then(function(info){
                def.resolve(config.get('ok'));
            })
            .then(null,function(err){
                def.reject({status:500,message:config.get('error.dberror')});
            });
        return def.promise;
    }
};

module.exports=syncing;