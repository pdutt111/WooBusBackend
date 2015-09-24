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
var bookingsTable=db.getbookingsdef;

var bookings={
    cityAutoSuggest:function(req,res){
        var def= q.defer();
        if(typeof req.query.q == string && req.query.q.length>3) {
            var re = new RegExp("" + req.query.q + "", 'i');
            cityTable.find({name: {$regex: re}}, "name -_id", function (err,docs) {
                if(!err) {
                    def.resolve(docs);
                }else{
                    def.reject({status:500,message:config.get('error.dberror')});
                }
            })
        }else{
            def.reject({status:400,message:config.get('error.badrequest')});
        }
        return def.promise;
    },
    getBuses:function(req,res){
        var def= q.defer();
        busTable.find({start:req.query.start,end:req.query.end,in_booking:true},"start end fare discounts " +
            "discounted_price departure_time" +
            " arrival_time boarding_points total_seats " +
            "images media_loaded distance seats bus_identifier",function(err,docs){
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
            var booking = new bookingsTable({
                user_id: req.user._id,
                bus_id: req.body.bus_id,
                amount: req.body.amount,
                seat_no: req.body.seat_no
            });
            booking.save(function (err, booking, info) {
                if (!err) {
                    def.resolve(booking);
                } else {
                    def.reject({status: 500, message: config.get('error.dberror')});
                }
            });

            return def.promise;
        },
        busTableEntry: function (req, res) {
            var def = q.defer();
            busTable.update({_id: new ObjectId(req.body.bus_id), 'seats.seat_no': req.body.seat_no},
                {$set: {'seats.$.is_booked': true, 'seats.$.booking_id': req.booking._id}}, function (err, info) {
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
            bookingsTable.update({_id: new ObjectId(req.booking._id)}, {$set: {is_confirmed: true}}, function (err, info) {
                if (!err) {
                    def.resolve(req.booking);
                } else {
                    def.reject({status: 500, message: config.get('error.dberror')});
                }
            });
            return def.promise;
        }
    }
};

module.exports=bookings;