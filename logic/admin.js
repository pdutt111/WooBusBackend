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
        if(req.user.is_admin&&req.user.is_admin){
            def.resolve()
        }else{
            def.reject({status:401,message:config.get('error.unauthorized')});
        }
        return def.promise;
    },
    getBuses:function(req,res){
        var def= q.defer();
        var search={user_id:req.query.operator_id,is_deleted:false}
        if(!req.query.operator_id){
            delete search.user_id;
        }
        busTable.find(search,"fare discounts departure_time arrival_time " +
            "distance images boarding_points route total_seats seats is_available")
            .populate("route","start end fare distance time_taken active scheduled_stops boarding_points")
            .exec()
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
        busTable.findOne({_id:new ObjectId(req.params.id),is_deleted:false},"start end fare discounts departure_time arrival_time" +
            " distance images boarding_points total_seats discounted_price route bus_type seats in_transit in_booking is_completed")
            .populate("route","start end fare distance time_taken active scheduled_stops boarding_points")
            .exec()
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
        busTable.update({_id:new ObjectId(req.params.id),is_deleted:false},{$set:req.body},function(err,info){
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
        routesTable.find({},"start end fare distance time_taken active scheduled_stops boarding_points",function(err,rows){
            if(!err){
                def.resolve(rows);
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }

        })
        return def.promise;
    },
    getRoute:function(req,res){
        var def= q.defer();
        routesTable.findOne({_id:new ObjectId(req.params.id)},"start end fare distance time_taken active " +
            "scheduled_stops boarding_points",function(err,route){
            if(!err){
                def.resolve(route);
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }

        })
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
    getAdmins:function(req,res){
        var def= q.defer();
        if(typeof req.query.q) {
            var re = new RegExp("" + req.query.q + "", 'i');
            userTable.find({name: {$regex: re}, is_admin: true}, "_id name email phonenumber is_verified address")
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
    approveOperator:function(req,res){
        var def= q.defer();
        userTable.update({_id:new ObjectId(req.params.id)},{$set:{is_verified:true}},function(err,info){
           if(!err){
               def.resolve(config.get('ok'))
           }else{
               def.reject({status:500,message:config.get('error.dberror')});
           }
        });
        return def.promise;
    },
    getUnverifiedOperators:function(req,res){
        var def= q.defer();
        userTable.find({is_operator:true,is_verified:false},"name email is_verified",function(err,operators){
            if(!err){
                def.resolve(operators);
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    },
    approveAdmin:function(req,res){
        var def= q.defer();
        userTable.update({_id:new ObjectId(req.params.id)},{$set:{is_verified:true}},function(err,info){
            if(!err){
                def.resolve(config.get('ok'))
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    },
    getUnverifiedAdmins:function(req,res){
        var def= q.defer();
        userTable.find({is_admin:true,is_verified:false},"name email is_verified",function(err,operators){
            if(!err){
                def.resolve(operators);
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
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
        routesTable.update({_id:new ObjectId(req.params.id)},{$set:req.body},function(err,info){
            if(!err){
                def.resolve(config.get('ok'));
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    },
    deleteBus:function(req,res){
        var def= q.defer();
        busTable.update({_id:new ObjectId(req.params.id)},{$set:{is_deleted:true}},function(err,info){
            if(!err){
                def.resolve(config.get('ok'));
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    },
    deleteRoute:function(req,res){
        var def= q.defer();
        routesTable.update({_id:new ObjectId(req.params.id)},{$set:{active:false}},function(err,info){
            if(!err){
                def.resolve(config.get('ok'));
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    },
    resetImages:function(req,res){
        var def= q.defer();
        busTable.update({_id:new ObjectId(req.params.id)},{$set:{images:[]}},function(err,info){
            if(!err){
                def.resolve(config.get('ok'));
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    },
    signinoverride:function(req,res){
        var def= q.defer();
        userTable.findOne({_id:new ObjectId(req.params.id)},"password email name").exec()
            .then(function(user){
                        def.resolve(user);
            })
            .then(null,function(err){
                def.reject({status: 500, message: config.get('error.dberror')});
            });
        return def.promise;
    }
}

module.exports=functions;