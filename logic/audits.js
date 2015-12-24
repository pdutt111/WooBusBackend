/**
 * Created by rohit on 21/12/15.
 */
var q= require('q');
var config= require('config');
var ObjectId = require('mongoose').Types.ObjectId;
var db=require('../db/DbSchema');
var log = require('tracer').colorConsole(config.get('log'));

var auditTable=db.getauditsdef;
var busTable=db.getbusdef;
var questionsTable=db.getquestionsdef;

var audits = {
    identifyBus:function(req, res) {
        var def = q.defer();
        busTable.findOne({bus_identifier:req.body.bus_identifier}, "_id",function(err,bus){
            if(!err && bus != null)
                def.resolve(bus);
            else if (bus == null)
                def.reject({status:400, message:config.get('error.badrequest')});
            else
                def.reject({status: 500, message: config.get('error.dberror')});
        });
        return def.promise;
    },
    addAudit:function(req, res) {
        var def = q.defer();
        req.body.bus_id = req.bus._id;
        var audit = new auditTable(req.body);
        audit.save(function (err, audit, info) {
            if (!err) {
                def.resolve(audit);
            }
            else {
                def.reject({status: 500, message: config.get('error.dberror')});
            }
        });
        return def.promise;
    },
    getAudits:function(req, res) {
        var def = q.defer();
        auditTable.find({},
            "bus_id bus_identifier location cleanliness volvo_driver phone_holder phone uniform first_aid pushback_lever legrest_lever ac_vent powersocket accessory_bag blankets headrest_cover reading_lamp audit_time created_time modified_time",
            {sort: {audit_time: -1}},
            function(err, rows) {
                if(!err) {
                    def.resolve(rows);
                }
                else {
                    def.reject({status: 500, message: config.get('error.dberror')});
                }
            });
        return def.promise;
    },
    getQuestions:function(req, res) {
        var def = q.defer();
        questionsTable.find({}, "question q_type name", {sort: {q_type: -1}},
            function(err, rows) {
                if(!err) {
                    def.resolve(rows);
                }
                else {
                    def.reject({status: 500, message: config.get('error.dberror')});
                }
            });
        return def.promise;
    },
    addQuestions:function(req, res) {
        var def = q.defer();
        questionsTable.collection.insert(req.body.questions, function(err, rows) {
            if(!err) {
                def.resolve("Questions added");
            }
            else {
                def.reject({status: 500, message: config.get('error.dberror')});
            }
        });
        return def.promise;
    }
};

module.exports = audits;