var express = require('express')
var router = express.Router()
var User = require('../models/user');
var log = require("./log4j");
var sha1 = require('sha1');
var validate = require("./sessionValidator");
var adminSession = require("./adminValidator");
var atob = require('atob')
var ActiveDirectory = require('activedirectory');

router.post("/authenticate", function (req, res) {
    if (req && req.body) {
        User.find({ ppc: req.body.ppc }, function (err, user) {
            if (!err && user && user.length == 1) {
                let userPassword = atob(req.body.password)
                if (sha1(userPassword) === user[0].password) {
                    req.session.cookie.expires = new Date(Date.now() + 600000);
                    req.session.sessionid = req.session.id;
                    req.session.user = user;
                    res.send({ 'name': user[0].name, 'ppc': user[0].ppc, 'role': user[0].role, 'FBU': user[0].FBU , 'isPasswordChanged': user[0].isPasswordChanged});
                } else {
                    log("Ad Login failed : " + err, 2, req);
                    res.status(500).send({ "error": 'Invalid username/password.' });
                }
                //SSO Enable code below:
                // var userName = config.domain + req.body.ppc + '@sib.co.in';
                // var password = atob(req.body.password)
                // var adConfig = {
                //     url: '{LDAP URL}',
                //     username: userName,
                //     password: password
                // }
                // var ad = new ActiveDirectory(adConfig);
                // ad.authenticate(userName, password, function (err, auth) {
                //     if (auth) {
                //         req.session.cookie.expires = new Date(Date.now() + 600000);
                //         req.session.sessionid = req.session.id;
                //         req.session.user = user;
                //         log("User " + user[0].ppc + "-" + user[0].name + " login successfully.", 1, req);
                //         res.send({ 'name': user[0].name, 'ppc': user[0].ppc, 'role': user[0].role, 'FBU': user[0].FBU });
                //     }
                //     else {
                //         if (!config.isLive) {
                //             req.session.cookie.expires = new Date(Date.now() + 600000);
                //             req.session.sessionid = req.session.id;
                //             req.session.user = user;
                //             res.send({ 'name': user[0].name, 'ppc': user[0].ppc, 'role': user[0].role, 'FBU': user[0].FBU });
                //         } else {
                //             log("Ad Login failed : " + err, 2, req);
                //             res.status(500).send({ "error": 'Invalid username/password. Incorrect attempts will lead to AD login lock.' });
                //         }
                //     }
                // });
            } else {
                log("Login failed : No such user ", 2, req);
                res.status(500).send({ "error": 'User not found. Please ask admin to add new user.' });
            }
        });
    }
})

router.post("/addUser", adminSession, function (req, res) {
    if (req && req.body) {
        User.find({ ppc: req.body.ppc }, function (err, user) {
            if (!err && user) {
                if (user.length != 0) {
                    log("New user creation failed : User already exists", 2, req);
                    res.status(409).send({ 'message': 'User already exists.' });
                } else {
                    var isAuth = req.body.fbuList.every(data => isAuthorised(req, data));
                    if (isAuth) {
                        var newUser = new User({
                            name: req.body.name,
                            ppc: req.body.ppc,
                            role: req.body.role,
                            password: sha1('Test@123'),
                            isPasswordChanged: false,
                            FBU: req.body.fbuList
                        });
                        newUser.save(function (err) {
                            if (!err) {
                                log("New User created successfully.", 1, req);
                                res.send({ 'message': 'Success' });
                            } else {
                                log("New user creation failed :" + err, 2, req);
                                res.status(500).send({ "error": 'Unexpected error occured.' });
                            }
                        })
                    } else {
                        res.status(400).send({ 'message': 'You can only provide access to any FBU which you already have access.' });
                    }
                }
            } else {
                log("New user creation failed :" + err, 2, req);
                res.status(500).send({ "error": 'Unexpected error occured.' });
            }
        });
    } else {
        log("New user creation failed : No request body", 2, req);
        res.status(500).send({ "error": 'Unexpected error occured.' });
    }
});

router.post("/changePassword", validate, function (req, res) {
    if (req && req.body) {
        User.find({ ppc: req.body.ppc }, function (err, user) {
            if (!err && user && user.length == 1) {
                if (user[0].password == req.body.currentPassword || user[0].password == req.body.newPassword) {
                    User.updateOne({ ppc: req.body.ppc }, {
                        password: req.body.newPassword,
                        isPasswordChanged: true
                    }, function (err, affected, resp) {
                        if (!err) {
                            log("Password changed successfully.", 1, req);
                            res.send({ 'message': "success", 'user': affected });
                        } else {
                            log("Change password failed :" + err, 2, req);
                            res.status(500).send({ "error": 'Unexpected error occured.' });
                        }
                    })
                } else {
                    log("Change password failed : Wrong current password or invalid change in password", 2, req);
                    res.status(500).send({ "error": 'Wrong current password or invalid change in password.' });
                }
            } else {
                log("Change password failed : Invalid user", 2, req);
                res.status(500).send({ "error": 'Unexpected error occured.' });
            }
        });
    }
})

router.post("/getallUsers", validate, function (req, res) {
    User
        .find({})
        .sort({ ppc: 1 })
        .exec(function (err, data) {
            if (!err && data) {
                log("All User data retrieved successfully", 1, req);
                res.send(data);
            } else {
                log("getallUsers failed:" + err, 2, req);
                res.status(500).send({ "error": 'Unexpected error occured.' });
            }
        })
});

router.post("/getUsersForKeyword", validate, function (req, res) {

    var usersProjection = {
        role: false,
        isPasswordChanged: false,
        password: false,
        FBU: false,
        created: false,
        __v: false
    };

    User
        .find({ 'name': { '$regex': req.body.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), '$options': 'i' } }, usersProjection)
        .limit(10)
        .sort({ ppc: 1 })
        .exec(function (err, data) {
            if (!err && data) {
                log("User search completed successfully", 1, req);
                res.send(data);
            } else {
                log("getallUsers failed:" + err, 2, req);
                res.status(500).send({ "error": 'Unexpected error occured.' });
            }
        })
});

router.post("/getFBUusers", validate, function (req, res) {
    User
        .find({ FBU: req.body.fbu })
        .sort({ ppc: 1 })
        .exec(function (err, data) {
            if (!err && data) {
                log("All User data retrieved successfully", 1, req);
                res.send(data);
            } else {
                log("getallUsers failed:" + err, 2, req);
                res.status(500).send({ "error": 'Unexpected error occured.' });
            }
        })
});

router.post("/getOneUser", validate, function (req, res) {
    if (req && req.body) {
        User.find({ ppc: req.body.ppc }, function (err, data) {
            if (!err && data && data.length == 1) {
                log(data[0].name + " user data retrieved successfully", 1, req);
                res.send({ 'name': data[0].name, 'ppc': data[0].ppc, 'role': data[0].role, 'FBU': data[0].FBU });
            } else {
                log("getOneUser failed:" + err, 2, req);
                res.status(500).send({ "error": 'Unexpected error occured.' });
            }
        });
    } else {
        log("getOneUser failed: No request body", 2, req);
        res.status(500).send({ "error": 'Unexpected error occured.' });
    }

});

router.post("/editSingle", adminSession, function (req, res) {
    if (req && req.body) {
        User.updateOne({ ppc: req.body.ppc }, {
            name: req.body.name,
            role: req.body.role,
            FBU: req.body.fbu
        }, function (err, affected, resp) {
            if (!err) {
                log(req.body.ppc + "user data updated successfully", 1, req);
                res.send({ 'message': "success", 'user': affected });
            } else {
                log("editSingle user failed:" + err, 2, req);
                res.status(500).send({ "error": 'Unexpected error occured.' });
            }
        })
    } else {
        log("editSingle user failed: No request body", 2, req);
        res.status(500).send({ "error": 'Unexpected error occured.' });
    }

});

router.post("/passwordReset", adminSession, function (req, res) {
    if (req && req.body) {
       // res.status(500).send({ "error": 'Unexpected error occured.' });
        User.updateOne({ ppc: req.body.ppc }, {
            password: sha1('Test@123'),
            isPasswordChanged: false
        }, function (err, affected, resp) {
            if (!err) {
                log(req.body.ppc + "Password reset successfully", 1, req);
                res.send({ 'message': "success", 'user': affected });
            } else {
                log("passwordReset failed:" + err, 2, req);
                res.status(500).send({ "error": 'Unexpected error occured.' });
            }
        })
    } else {
        log("passwordReset failed: No request body", 2, req);
        res.status(500).send({ "error": 'Unexpected error occured.' });
    }

});

router.post("/delete", adminSession, function (req, res) {
    if (req && req.body) {
        User.remove({ ppc: req.body.ppc }, function (err) {
            if (!err) {
                log(req.body.ppc + " user removed successfully", 1, req);
                res.send({ 'message': "success" });
            }
            else {
                log("Delete user failed:" + err, 2, req);
                res.status(500).send({ "error": 'Unexpected error occured.' });
            }
        })
    } else {
        log("Delete user failed: No request body", 2, req);
        res.status(500).send({ "error": 'Unexpected error occured.' });
    }
});

function isAuthorised(request, data) {
    return request.session.user[0].FBU.includes(data);
}

module.exports = router