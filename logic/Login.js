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
var bcrypt = require('bcrypt');

var userTable;
var pinTable;
    userTable=db.getuserdef;
    pinTable=db.getpindef;

var users={
    //pinLogic:function(req,res){
    //    var def= q.defer();
    //    var pin=Math.floor(Math.random()*90000) + 10000;
    //    pinTable.update({phonenumber:req.body.phonenumber},{phonenumber:req.body.phonenumber,pin:pin,used:false},
    //        {upsert:true}).exec()
    //        .then(function(info){
    //            def.resolve(pin);
    //        }).
    //        then(null,function(err){
    //            def.reject({status:500,message:err})
    //        })
    //    return def.promise;
    //},
    userCreate:function(req,res){
            var def= q.defer();
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(req.body.password, salt, function(err, hash) {
                    // Store hash in your password DB.
                    req.body.password=hash;
                    var user = new userTable(req.body);
                    user.save(function(err,user,info){
                        if(!err){
                            def.resolve(user);
                        }else{
                            if(err.code==11000) {
                                    def.reject({status: 401, message: config.get('error.unauthorized')});
                            }else{
                                def.reject({status: 500, message: config.get('error.dberror')});
                            }
                        }
                    });
                });
            });

            return def.promise;
        },
    signin:function(req,res){
        var def= q.defer();
        userTable.findOne({email:req.body.email},"password email name").exec()
            .then(function(user){
                bcrypt.compare(req.body.password,user.password,function(err,res){
                    if(err){
                        def.reject({status: 500, message: config.get('error.dberror')});
                        return;
                    }
                    if(res){
                        def.resolve(user);
                    }else{
                        def.reject({status: 401, message: config.get('error.unauthorized')});
                    }
                });
            })
            .then(null,function(err){
                def.reject({status: 500, message: config.get('error.dberror')});
            });
        return def.promise;
    },
    renewToken:function(req,res){
        var def= q.defer();
        if(req.user._id==req.body.secret) {
            def.resolve();
        }else{
            def.reject({status:401,message:config.get('error.unauthorized')});
        }
        return def.promise;
    },
    sendToken:function(req,res){
        var def= q.defer();
        delete req.user.is_operator;
        delete req.user.password;
        var expires = new Date(moment().add(config.get('token.expiry'), 'days').valueOf()).toISOString();
        var token_data={
            user: req.user,
            exp: expires
        };
        var token = jwt.encode({
            data:crypto.encryptObject(token_data)
        }, config.get('jwtsecret'));
        var response={
            token: token,
            secret:req.user._id,
            expires: expires
        };
        def.resolve(response);
        return def.promise;
    }
}

module.exports=users;