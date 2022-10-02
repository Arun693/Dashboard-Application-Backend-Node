var express = require('express')
var router = express.Router()
var AppNames = require('../models/applicationNames');
var validate = require("./sessionValidator");
var adminSession = require("./adminValidator");
var log = require("./log4j");
var serverInfo = require('../models/serverDetails');
var mongoose = require('mongoose');

router.post("/saveServerInfo", adminSession, function (req, res) {

    if (req && req.body) {
        serverInfo
            .find({ channelID: req.body.channelType, application: req.body.applicationID })
            .exec(function (err, data) {
                if (!err && data && data.length > 0) {
                    const updateServerObject = {
                        channelID: req.body.channelType,
                        application: mongoose.Types.ObjectId(req.body.applicationID),
                        publicDCIP: req.body.publicDCIP,
                        publicDRIP: req.body.publicDRIP,
                        publicUATIP: req.body.publicUATIP,
                        publicDomainLive: req.body.publicDomainLive,
                        publicDomainUAT: req.body.publicDomainUat,
                        serverArray: req.body.serverArray,
                        lastUpdateBy: req.session.user[0].ppc
                    };
                    serverInfo.updateOne({ _id: data[0]._id }, updateServerObject, function (err, raw) {
                        if (err) {
                            log("Error while updating server info :" + err, 2, req);
                            res.status(500).send({ "error": 'Unexpected error occured.' });
                        }
                        log("Server info updated successfully", 1, req);
                        res.send({ "message": "Details saved successfully." });
                    });
                } else {
                    var serverObject = new serverInfo({
                        channelID: req.body.channelType,
                        application: mongoose.Types.ObjectId(req.body.applicationID),
                        publicDCIP: req.body.publicDCIP,
                        publicDRIP: req.body.publicDRIP,
                        publicUATIP: req.body.publicUATIP,
                        publicDomainLive: req.body.publicDomainLive,
                        publicDomainUAT: req.body.publicDomainUat,
                        serverArray: req.body.serverArray,
                        lastUpdateBy: req.session.user[0].ppc,
                    });
                    serverObject.save(function (err) {
                        if (!err) {
                            log("Server info inserted successfully", 1, req);
                            res.send({ "message": "Details saved successfully." });
                        } else {
                            log("Error while inserting server info :" + err, 2, req);
                            res.status(500).send({ "error": 'Unexpected error occured.' });
                        }
                    });
                }
            })
    } else {
        log("saveServerInfo failed: No request body", 2, req);
        res.status(500).send({ "error": 'Unexpected error occured.' });
    }
});


router.post("/getServerInfo", validate, function (req, res) {
    serverInfo
        .find({ channelID: req.body.channelType, application: req.body.applicationID })
        .populate('application')
        .exec(function (err, data) {
            if (!err && data) {
                log("Server info retrieved successfully", 1, req);
                res.send(data);
            } else {
                log("Error while retrieving server info :" + err, 2, req);
                res.status(500).send({ "error": 'Unexpected error occured.' });
            }
        })
});

router.post("/searchServerIP", function (req, res) {
    var searchParam = {
        $or: [
            { 'serverArray': { '$elemMatch': { 'liveIP': req.body.ipAddress } } },
            { 'serverArray': { '$elemMatch': { 'externalDependencyIp': req.body.ipAddress } } },
            { 'serverArray': { '$elemMatch': { 'uatIP': req.body.ipAddress } } },
            { 'serverArray': { '$elemMatch': { 'drIP': req.body.ipAddress } } },
        ]
    }
    serverInfo.find(searchParam)
        .populate('application')
        .exec(function (err, data) {
            if (err) {
                log("Error while retrieving server info :" + err, 2, req);
                res.status(500).send({ "error": 'Unexpected error occured.' });
            }
            log("Server info retrieved successfully", 1, req);
            res.send(data);
        });
});

module.exports = router