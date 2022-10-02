var express = require('express')
var router = express.Router()
var validate = require("./sessionValidator");
var adminSession = require("./adminValidator");
var log = require("./log4j");
var incident = require('../models/incidentDetails');
var async = require('async');

router.post("/saveIncident", validate, function (req, res) {
    if (req && req.body) {
        var newIncident = new incident({
            application: req.body.application,
            fbu: req.body.fbu,
            issue: req.body.issue,
            occurrence: req.body.occurrence,
            rca: req.body.rca,
            requestType: req.body.requestType,
            durationArray: req.body.durationArray,
            staffList: req.body.staffList,
            crfNumber: req.body.crfNumber,
            createdBy: req.session.user[0].ppc
        });
        newIncident.save(function (err) {
            if (!err) {
                res.send({ "message": "Incident details saved successfully." });
            } else {
                res.status(500).send({ "error": 'Unexpected error occured.' });
            }
        })

    } else {
        res.status(500).send({ "error": 'Unexpected error occured.' });
    }
});

router.post("/getIncidents", validate, function (req, res) {
    var searchParam = {
        "fbu": req.body.fbu
    }
    if (req.body && req.body.appId) {
        searchParam['application'] = { $in: req.body.appId }
    }
    if (req.body && req.body.type) {
        searchParam['requestType'] = { $in: req.body.type }
    }
    if (req.body && req.body.searchTxt) {
        searchParam['issue'] = { $regex: req.body.searchTxt, $options: 'i' }
    }
    var perPage = 10
    var page = req.body.page || 1
    var offset = (page - 1) * perPage;
    incident
        .find(searchParam)
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .populate('staffList', 'name')
        .sort({ createdTime: 1 })
        .exec(function (err, incidents) {
            incident.count(searchParam).exec(function (err, count) {
                if (err) {
                    log("Incident search failed : " + err, 2, req);
                    res.status(500).send({ "error": 'Unexpected error occured.' });
                }
                else {
                    log("Incident search completed: Page No - " + page, 1, req);
                    res.send({ "message": "success", "data": incidents, "current": page, "pages": Math.ceil(count / perPage), "offset": offset });
                }
            })
        })
})

router.post("/downloadAsExcel", validate, function (req, res) {
    var searchParam = {
        "fbu": req.body.fbu
    }
    if (req.body && req.body.appId) {
        searchParam['application'] = { $in: req.body.appId }
    }
    if (req.body && req.body.type) {
        searchParam['requestType'] = { $in: req.body.type }
    }
    if (req.body && req.body.searchTxt) {
        searchParam['issue'] = { $regex: req.body.searchTxt, $options: 'i' }
    }
    incident
        .find(searchParam)
        .populate('staffList', 'name')
        .sort({ createdTime: 1 })
        .exec(function (err, incidents) {
            if (err || incidents.length < 1) {
                log("Incident excel download failed : " + err, 2, req);
                res.status(500).send({ "error": 'Unexpected error occured.' });
            } else {
                let excelData = [];
                for (var j = 0; j < incidents.length; j++) {
                    let loopIncident = {};
                    loopIncident['Sl Number'] = j + 1;
                    loopIncident['IncidentType'] = incidents[j].requestType;
                    loopIncident['Application'] = incidents[j].application;
                    loopIncident['Occurrence'] = incidents[j].occurrence;
                    loopIncident['Incident/Feature Details'] = incidents[j].issue;
                    loopIncident['RCA/Servers affected'] = incidents[j].rca;
                    loopIncident['CRF/DRF Number'] = incidents[j].crfNumber ? incidents[j].crfNumber : 'NA';
                    if (incidents[j].durationArray && incidents[j].durationArray.length > 0) {
                        let duratnTxt = '';
                        for (var k = 0; k < incidents[j].durationArray.length; k++) {
                            if (duratnTxt != '') {
                                duratnTxt = duratnTxt + ', and ' + new Date(incidents[j].durationArray[k].fromTime).toLocaleString() + ' to ' + new Date(incidents[j].durationArray[k].toTime).toLocaleString();
                            } else {
                                duratnTxt = new Date(incidents[j].durationArray[k].fromTime).toLocaleString() + ' to ' + new Date(incidents[j].durationArray[k].toTime).toLocaleString();
                            }
                        }
                        loopIncident['Date'] = duratnTxt;
                    }
                    if (incidents[j].staffList && incidents[j].staffList.length > 0) {
                        let staffTxt = '';
                        for (var c = 0; c < incidents[j].staffList.length; c++) {
                            if (staffTxt != '') {
                                staffTxt = staffTxt + ',' + incidents[j].staffList[c].name
                            } else {
                                staffTxt = incidents[j].staffList[c].name
                            }
                        }
                        loopIncident['Staff Involved'] = staffTxt;
                    }
                    excelData.push(loopIncident);
                }
                log("Incident data for excel is retrived. ", 1, req);
                res.send({ "message": "success", "data": excelData });
            }
        })
})

router.post("/deleteIncident", adminSession, function (req, res) {
    incident.find({ _id: req.body.id }, function (err, data) {
        if (!err && data && data.length == 1) {
            incident.remove({ _id: req.body.id }, function (err) {
                if (!err) {
                    log("Incident deleted successfully.", 1, req);
                    res.send({ "message": "success" });
                }
                else {
                    log("Incident delete failed : " + err, 2, req);
                    res.status(500).send({ "error": 'Unexpected error occured.' });
                }
            });
        } else {
            log("Incident delete failed : ", 2, req);
            res.status(500).send({ "error": 'Unexpected error occured.' });
        }
    });
})

module.exports = router