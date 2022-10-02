var express = require('express')
var router = express.Router()
var hashTags = require('../models/hashtags')
var validate = require("./sessionValidator");
var log = require("./log4j");

router.post("/getHashTags", validate, function (req, res) {
    hashTags
        .find({ 'hashTag' : { '$regex' : req.body.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), '$options' : 'i' } })  
        .limit(10)
        .sort({ name: 1 })
        .exec(function (err, data) {
            if (!err && data) {
                log("hastags searched and found : ", 1, req);
                res.send(data);
            } else {
                log("Error in getHashTags : " +err, 2, req);
                res.status(500).send({ "error": 'Unexpected error occured in hashtag search.' });
            }
        })
});

module.exports = router
