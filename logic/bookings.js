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
var cityTable=db.getcitiesdef;
var bookingsTable=db.getbookingsdef
var routeTable=db.getroutesdef;;

var bookings={
    cityAutoSuggest:function(req,res){
        var def= q.defer();
        log.info(req.query);
        if(req.query.q.length>=3) {
            var re = new RegExp(req.query.q, 'i');
            cityTable.find({name: {$regex: re}}, "name -_id", function (err,docs) {
                if(!err) {
                    var cities=[];
                    for(var count in docs){
                           cities.push(docs[count].name);
                    }
                    log.warn(cities);
                    def.resolve(cities);
                }else{
                    def.reject({status:500,message:config.get('error.dberror')});
                }
            })
        }else{
            def.reject({status:400,message:config.get('error.badrequest')});
        }
        return def.promise;
    },
    getRoute:function(req,res){
        var def= q.defer();
        routeTable.findOne({start:req.query.start,end:req.query.end},"_id",function(err,route){
            console.log(err,route);
            if(!err){
                if(route) {
                    def.resolve(route);
                }else{
                    def.reject({status:200,message:config.get("error.noroute")});
                }
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }

        });
        return def.promise;
    },
    getCities:function(req,res){
        var def= q.defer();
        def.resolve(config.get('cities'));
        return def.promise;
    },
    getBuses:function(req,res){
        var def= q.defer();
        var lowDate=new Date(req.query.date);
        lowDate.setHours(0,0,0,0);
        var highDate=new Date(req.query.date);
        highDate.setHours(0,0,0,0);
        highDate.setUTCDate(highDate.getUTCDate()+1);
        log.info(lowDate.toUTCString(),highDate.toUTCString());
        busTable.find({route:req.route,in_booking:true,departure_time:{$gte:lowDate,$lte:highDate}},"fare discounts " +
            "discounted_price departure_time" +
            " arrival_time boarding_points total_seats " +
            "images media_loaded distance route seats bus_identifier")
            .populate("route","start end fare distance time_taken active scheduled_stops boarding_points")
            .exec(function(err,docs){
            if(!err){
                def.resolve(docs);
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }

        });
        return def.promise;
    },
    getBus:function(req,res){
        var def= q.defer();
        busTable.findOne({_id:new ObjectId(req.params.id)},"fare discounts " +
            "discounted_price departure_time" +
            " arrival_time boarding_points total_seats " +
            "images media_loaded route user_id distance seats bus_identifier")
            .populate("route","start end fare distance time_taken active scheduled_stops boarding_points")
            .populate("user_id","name -_id")
            .exec(function(err,docs){
            if(!err){
                def.resolve(docs);
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }

        });
        return def.promise;
    },
    bookbus: {
        bookingsTableEntry: function (req, res) {
            var def = q.defer();
                busTable.findOne({_id: new ObjectId(req.body.bus_id)}, "fare", function (err, bus) {
                    var seats
                    if(!req.body.seat_no instanceof Array) {
                        seats=[req.body.seat_no];
                    }else{
                        seats=req.body.seat_no;
                    }
                    req.body.seat_no=seats;
                        bookingsTable.find({bus_id:new ObjectId(req.body.bus_id),seat_no:{$in:seats},is_deleted:false},"_id",function(err,buses){
                            if(!err&&!booking) {
                                var booking = new bookingsTable({
                                    user_id: new ObjectId(req.user._id),
                                    bus_id: new ObjectId(req.body.bus_id),
                                    amount: bus.fare,
                                    seat_no: seats
                                });
                                booking.save(function (err, booking, info) {
                                    if (!err) {
                                        def.resolve(booking);
                                    } else {
                                        def.reject({status: 500, message: config.get('error.dberror')});
                                    }
                                });
                            }
                        });
                });
            return def.promise;
        },
        busTableEntry: function (req, res) {
            var def = q.defer();
            async.each(req.body.seat_no,function(val,callback){
                busTable.update({_id: new ObjectId(req.body.bus_id), 'seats.seat_no': val},
                    {$set: {'seats.$.is_booked': true, 'seats.$.booking_id': req.booking._id}}, function (err, info) {
                        callback(err);
                    });
            },function(err){
                if (!err) {
                    def.resolve(config.get('ok'));
                } else {
                    def.reject({status: 500, message: config.get('error.dberror')});
                }
            });
            return def.promise;
        },
        bookingsTableConfirm: function (req, res) {
            var def = q.defer();
            bookingsTable.update({_id: new ObjectId(req.body._id)}, {$set: {is_confirmed: true}}, function (err, info) {
                if (!err) {
                    def.resolve(req.booking);
                } else {
                    def.reject({status: 500, message: config.get('error.dberror')});
                }
            });
            return def.promise;
        },
        bookingsTableReject: function (req, res) {
            var def = q.defer();
            bookingsTable.remove({_id: new ObjectId(req.body._id)}, {$set: {is_confirmed: true}}, function (err, info) {
                async.each(req.body.seat_no,function(val,callback){
                    busTable.update({_id: new ObjectId(req.body.bus_id), 'seats.seat_no': val},
                        {$set: {'seats.$.is_booked': false },$unset:{'seats.$.booking_id':""}}, function (err, info) {
                            callback(err);
                        });
                },function(err){
                    if (!err) {
                        def.resolve(config.get('ok'));
                    } else {
                        def.reject({status: 500, message: config.get('error.dberror')});
                    }
                });
            });
            return def.promise;
        }
    }
};

module.exports=bookings;