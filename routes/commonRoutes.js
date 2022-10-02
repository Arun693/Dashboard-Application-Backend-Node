var express = require('express')
var router = express.Router()
var AppNames = require('../models/applicationNames');
var DocumentTypes = require('../models/documentTypes');
var validate = require("./sessionValidator");
var log = require("./log4j");
var documentDetails = require('../models/documentEntry');
var user = require('../models/user');
var incident = require('../models/incidentDetails');
var channelTypes = require('../models/channelTypes');

router.post("/getApplicationNames", validate, function (req, res) {
    AppNames
        .find({ channelID: req.body.channelID })
        .sort({ name: 1 })
        .exec(function (err, data) {
            if (!err && data) {
                log("Application Names Returned : ", 1, req);
                res.send(data);
            } else {
                log("Error in getApplicationNames : " + err, 2, req);
                res.status(500).send({ "error": 'Unexpected error occured.' });
            }
        })
});


router.post("/addApplication", validate, function (req, res) {
    if (req && req.body && req.body.currentUser && req.body.currentUser.role == 'admin') {
        var newApp = new AppNames({
            id: "10",
            name: "New App",
            channelID: 1
        });
        newApp.save(function (err) {
            if (!err) {
                res.send('User added successfully.');
            } else {
                res.status(500).send({ "error": 'Unexpected error occured.' });
            }
        })

    } else {
        res.status(500).send({ "error": 'Unexpected error occured.' });
    }
});

router.post("/getDocumentTypes", validate, function (req, res) {
    DocumentTypes
        .find({})
        .sort({ name: 1 })
        .exec(function (err, data) {
            if (!err && data) {
                log("Document Types Returned : ", 1, req);
                res.send(data);
            } else {
                log("Error in getApplicationNames : " + err, 2, req);
                res.status(500).send({ "error": 'Unexpected error occured.' });
            }
        })
});

router.post("/getCounts", validate, function (req, res) {
    var counts = {};
    documentDetails.count().exec(function (err, count) {
        if (err) res.status(500).send({ "error": 'Unexpected error occured.' });
        else {
            counts.documents = count;
            user.count().exec(function (err, countUser) {
                if (err) {
                    log("Error in getApplicationNames : " + err, 2, req);
                    res.status(500).send({ "error": 'Unexpected error occured.' });
                }
                else {
                    counts.users = countUser;
                    incident.count().exec(function (err, incidentCount) {
                        if (!err) {
                            counts.incidents = incidentCount;
                            log("Get Count Returned : " + counts, 1, req);
                            res.send({ "message": "success", "data": counts });
                        } else {
                            counts.incidents = 0;
                            log("Get Count Returned : " + counts, 1, req);
                            res.send({ "message": "success", "data": counts });
                        }
                    })
                }
            })
        }
    })
});

router.post("/getchannelTypes", validate, function (req, res) {
    channelTypes
        .find({})
        .sort({ name: 1 })
        .exec(function (err, data) {
            if (!err && data) {
                log("Channel Types Returned: ", 1, req);
                res.send(data);
            } else {
                log("Error in getchannelTypes : " + err, 2, req);
                res.status(500).send({ "error": 'Unexpected error occured.' });
            }
        })
});

router.post('/logout', function (req, res) {
    if (req.session && req.session.user) {
        log("User " + req.session.user[0].name + " with session ID " + req.session.id + " logged out.", 1, req);
    }
    req.session.destroy()
    req.session = null;
    res.send({ "message": "success" });
});

module.exports = router