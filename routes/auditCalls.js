/**
 * Created by rohit on 21/12/15.
 */
    require('../jobs/mailer')
var express = require('express');
var router = express.Router();
var params = require('parameters-middleware');
var ObjectId = require('mongoose').Types.ObjectId;
var db=require('../db/DbSchema');
var config= require('config');
var jwt = require('jwt-simple');
var crypto=require('../authentication/crypto');
var log = require('tracer').colorConsole(config.get('log'));
var events = require('../events');

var auditLogic=require('../logic/audits');
var adminLogic=require('../logic/admin');

//, 'location', 'audit_time', 'volvo_driver', 'uniform', 'phone', 'first_aid', 'cleanliness', 'pushback_lever', 'legrest_lever', 'ac_vent', 'powersocket', 'phone_holder', 'accessory_bag', 'blankets', 'headrest_cover', 'reading_lamp'

router.post('/add',
    params({body:['bus_identifier']}, {message: config.get('error.badrequest')}),
    function(req, res, next) {
        auditLogic.identifyBus(req, res)
            .then(function(response){
                req.bus=response;
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
            .done();
    },
    function(req, res) {
        auditLogic.addAudit(req, res)
            .then(function(response){
                res.json(response);
                var data = {};
                data.subject = "Audit Data for Bus: " + response.bus_identifier;
                data.text = JSON.stringify(response, null, 2);
                events.emitter.emit("mail", data);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
            .done();
    }
);

router.get('/protected/audits',
    params({headers:['authorization']}, {message: config.get('error.badrequest')}),
    function(req, res, next) {
        adminLogic.verifyAdmin(req, res, next)
            .then(function () {
                next();
            })
            .catch(function (err) {
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        auditLogic.getAudits(req, res, next)
            .then(function(response) {
                res.json(response);
            })
            .catch(function (err) {
                res.status(err.status).json(err.message);
            }).done()
    }
)
router.post('/protected/questions',
    params({body:['questions', 'q_type', 'name']}, {message: config.get('error.badrequest')}),
    function(req, res, next) {
        adminLogic.verifyAdmin(req, res, next)
            .then(function () {
                next();
            })
            .catch(function (err) {
                res.status(err.status).json(err.message);
            }).done();
    },
    function(req, res, next) {
        auditLogic.addQuestions(req, res)
            .then(function(response) {
                res.json(response);
            })
            .catch(function(err) {
                res.status(err.status).json(err.message);
            }).done();
    }
);

router.get('/questions',
    function(req, res, next) {
        auditLogic.getQuestions(req, res)
            .then(function(response) {
                res.json(response);
            })
            .catch(function(err) {
                res.status(err.status).json(err.message);
            }).done();
    }
);

module.exports = router;