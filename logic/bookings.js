/**
 * Created by pariskshitdutt on 09/09/15.
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
var bookingsTable=db.getbookingsdef;

var bookings={
    bookBus:function(req,res){
        var def= q.defer();
        var booking=new bookingsTable({user_id:req.user._id,bus_id:req.body.bus_id,amount:req.body.amount,seat_no:req.body.seat_no});
        booking.save(function(err,booking,info){
            if(!err) {
                def.resolve(booking);
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });

        return def.promise;
    }
};

module.exports=bookings;