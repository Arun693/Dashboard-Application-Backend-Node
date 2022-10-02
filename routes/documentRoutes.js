var express = require('express')
var router = express.Router()
var documentDetails = require('../models/documentEntry');
var validate = require("./sessionValidator");
var adminSession = require("./adminValidator");
var log = require("./log4j");
var multer = require('multer');
var path = require("path");
var fs = require('fs');
var hashTags = require('../models/hashtags');
var mongoose = require('mongoose')
mongoose.Promise = require('bluebird');
//var GridFsStorage = require('multer-gridfs-storage');
const { GridFsStorage } = require('multer-gridfs-storage');
var Grid = require('gridfs-stream');
var async = require('async');
Grid.mongo = mongoose.mongo;
var gfs = Grid(mongoConnection.db, mongoose.mongo);
gfs.collection('uploads');

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.fileLocation)
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname + '-' + Date.now() + path.extname(file.originalname));
  }
});
var upload = multer({ storage: storage });

var blobStorage = new GridFsStorage({
  url: config.dbURL,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      var datetimestamp = Date.now();
      const fileInfo = {
        filename: file.originalname + '-' + Date.now() + path.extname(file.originalname),
        bucketName: 'uploads'
      };
      resolve(fileInfo);
    });
  }
});

var blobUpload = multer({
  storage: blobStorage
})

router.post("/upload", validate, upload.single('file'), function (req, res, next) {
  if (req.file && req.file.filename) {
    log("Basic File Upload success : " + req.file.originalname, 1, req);
    res.send({ "fileName": req.file.filename, "orginalName": req.file.originalname });
  } else {
    log("Basic File Upload error ", 2, req);
    res.status(500).send({ "error": 'Unexpected error occured.' });
  }
});

router.post("/uploadBlob", validate, blobUpload.single('file'), function (req, res, next) {
  if (req.file && req.file.filename) {
    log("Blob File Upload success : " + req.file.originalname, 1, req);
    res.send({ "fileName": req.file.filename, "orginalName": req.file.originalname, "isBlob": true });
  } else {
    log("Blob File Upload error ", 2, req);
    res.status(500).send({ "error": 'Unexpected error occured.' });
  }
});

router.post("/saveDocDetails", validate, function (req, res) {
  if (req && req.body) {
    var allowedUsers = [];
    if (req.body.allowedUsers && req.body.allowedUsers.length > 0) {
      allowedUsers = req.body.allowedUsers;
      allowedUsers.push(req.session.user[0].ppc);
    } else {
      allowedUsers.push(0);
    }
    var newDoc = new documentDetails({
      fileName: req.body.fileName,
      orginalName: req.body.orginalName,
      applicationName: req.body.applicationName,
      documentName: req.body.documentName,
      documentType: req.body.documentType,
      documentDate: req.body.documentDate,
      isBlob: req.body.isBlob,
      createdBy: req.session.user[0].ppc,
      allowedUsers: allowedUsers,
      FBU: req.body.fbu,
      hashTags: req.body.hashTags
    });
    newDoc.save(function (err) {
      if (!err) {
        log("File Upload data saved to database : ", 1, req);
        var newHarsh = [];
        if (req.body.hashTags && req.body.hashTags.length > 0) {
          async.each(req.body.hashTags, function (item, callback) {
            hashTags.find({ hashTag: item }).exec(function (err, docs) {
              if (!err && docs && docs.length == 0) {
                var ht = new hashTags({
                  fbu: req.body.fbu,
                  hashTag: item,
                  createdBy: req.session.user[0].ppc
                })
                ht.save(function (err, result) {
                  callback(null)
                });
              } else {
                callback(null)
              }
            })
          }, function (err) {
            res.send({ "message": "Document details added successfully."});
          });

        } else {
          res.send({ "message": "Document details added successfully." });

        }
      } else {
        log("File Upload data saved to database failed ", 2, req);
        fs.unlink(config.fileLocation + '/' + req.body.fileName, (err) => {
          if (err) {
            res.status(500).send({ "error": 'Unexpected error occured.' });
          } else {
            res.status(500).send({ "error": 'Unexpected error occured.' });
          }
        });
      }
    })
  } else {
    log("File Upload data saved to database failed - No request body", 2, req);
    res.status(500).send({ "error": 'Unexpected error occured.' });
  }
})

router.post("/searchDocument", validate, function (req, res) {
  var searchParam = {
    "documentDate": { $gte: "01/01/1900" },
    "allowedUsers": { $in: [0, req.session.user[0].ppc] },
    "FBU": req.body.fbu
  }
  if (req.body && req.body.applicationName) {
    searchParam['applicationName'] = { $in: req.body.applicationName }
  }
  if (req.body && req.body.documentType) {
    searchParam['documentType'] = req.body.documentType;
  }
  if (req.body && req.body.documentFromDate && req.body.documentToDate) {
    searchParam['documentDate'] = { $gte: req.body.documentFromDate, $lte: req.body.documentToDate }
  }
  if (req.body && req.body.documentFromDate && !req.body.documentToDate) {
    searchParam['documentDate'] = { $gte: req.body.documentFromDate }
  } else if (req.body && !req.body.documentFromDate && req.body.documentToDate) {
    searchParam['documentDate'] = { $lte: req.body.documentToDate }
  }
  if (req.body && req.body.hashTags && req.body.hashTags.length > 0) {
    searchParam['hashTags'] = { $in: req.body.hashTags }
  }
  if (req.body && req.body.documentName) {
    searchParam['documentName'] = { $regex: req.body.documentName , $options : 'i'}
  }

  var perPage = 10
  var page = req.body.page || 1
  var offset = (page - 1) * perPage;
  documentDetails
    .find(searchParam)
    .skip((perPage * page) - perPage)
    .limit(perPage)
    .sort({ documentDate: 1 })
    .exec(function (err, documents) {
      documentDetails.count(searchParam).exec(function (err, count) {
        if (err) {
          log("Document search failed : " + err, 2, req);
          res.status(500).send({ "error": 'Unexpected error occured.' });
        }
        else {
          log("Document search completed: Page No - " + page, 1, req);
          res.send({ "message": "success", "data": documents, "current": page, "pages": Math.ceil(count / perPage), "offset": offset });
        }
      })
    })
})

router.post("/deleteDocument", adminSession, function (req, res) {
  documentDetails.find({ _id: req.body.id }, function (err, data) {
    if (!err && data && data.length == 1) {
      var documentName = data[0].fileName;
      documentDetails.remove({ _id: req.body.id }, function (err) {
        if (!err) {
          fs.unlink(config.fileLocation + '/' + documentName, (err) => {
            if (err) {
              log("File delete failed : " + err, 2, req);
              res.status(500).send({ "error": 'Unexpected error occured.' });
            } else {
              log("File Deleted successfully. File Name : " + documentName, 1, req);
              res.send({ "message": "success" });
            }
          });
        }
        else {
          log("File delete failed : " + err, 2, req);
          res.status(500).send({ "error": 'Unexpected error occured.' });
        }
      });
    } else {
      log("File delete failed - No request body ", 2, req);
      res.status(500).send({ "error": 'Unexpected error occured.' });
    }
  });
})

router.post("/deleteBlobDocument", validate, function (req, res) {
  documentDetails.find({ _id: req.body.id }, function (err, data) {
    if (!err && data && data.length == 1) {
      var documentName = data[0].fileName;
      documentDetails.remove({ _id: req.body.id }, function (err) {
        if (!err) {
          gfs.findOne({ filename: documentName, root: 'uploads' }, function (err, file) {
            if (err || !file) {
              log("Blob File delete failed : No  such file" + err, 2, req);
              res.status(500).send({ "error": 'File Not Found.' });
            } else {
              gfs.db.collection('uploads.files').remove({ _id: file._id }, function (err) {
                if (err) {
                  log("Blob File delete failed : " + err, 2, req);
                  res.status(500).send({ "error": 'Unexpected error occured.' });
                } else {
                  gfs.db.collection('uploads.chunks').remove({ files_id: file._id }, function (error) {
                    if (error) {
                      log("Blob File delete failed : No  such file" + error, 2, req);
                      res.status(500).send({ "error": 'File Not Found.' });
                    } else {
                      log("Blob File Deleted successfully. File name  : " + documentName, 1, req);
                      res.send({ "message": "success" });
                    }
                  })
                }
              });
            }
          });
        }
        else {
          log("Blob File delete failed : " + err, 2, req);
          res.status(500).send({ "error": 'Unexpected error occured.' });
        }
      });
    } else {
      log("Blob File delete failed : " + err, 2, req);
      res.status(500).send({ "error": 'Unexpected error occured.' });
    }
  });
})

router.get("/download/:name(*)", validate, function (req, res, next) {

  var file = req.params.name;
  var path = config.fileLocation + '/' + file;
  res.download(path, file, function (err) {
    if (err) {
      log("Basic File download failed : " + err, 2, req);
      res.status(500).send({ "error": 'Unexpected error occured.' });
    } else {
      log("Basic File is downloaded successfully", 1, req);
      res.send({ "message": 'success' });
    }
  });
});


router.get("/downloadBlob/:name(*)", validate, function (req, res, next) {

  var file = req.params.name;
  documentDetails.findOne({ fileName: file }, function (err, data) {
    if (!err && data) {
      let isAllowed = false;
      if (data.allowedUsers && data.allowedUsers.length > 0) {
        for (let i = 0; i <= data.allowedUsers.length; i++) {
          if (data.allowedUsers[i] == 0 || data.allowedUsers[i] == req.session.user[0].ppc) {
            isAllowed = true;
            break;
          }
        }
      }
      if (isAllowed) {
        gfs.findOne({ filename: req.params.name, root: 'uploads' }, function (err, file) {
          if (err || !file) {
            log("Blob File download failed : " + err, 2, req);
            res.status(500).send({ "error": 'Unexpected error occured while downloading file.' });
          }
          res.set('Content-Type', file.contentType);
          res.set('Content-Disposition', 'attachment; filename="' + file.filename + '"');

          var readstream = gfs.createReadStream({
            filename: req.params.name,
            root: 'uploads'
          });

          readstream.on("error", function (err) {
            res.end();
          });
          readstream.pipe(res);
        });
      } else {
        log("Blob File download failed : Unauthorized user", 2, req);
        res.status(500).send({ "error": 'This file is not available to you.' });
      }
    } else {
      log("Blob File download failed: No such file", 2, req);
      res.status(500).send({ "error": 'Unexpected error occured.' });
    }
  })
});


module.exports = router