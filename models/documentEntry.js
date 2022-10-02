
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var documentSchema = mongoose.Schema({
    fileName: String,
    orginalName: String,
    applicationName: [Number],
    allowedUsers: [Number],
    isBlob: Boolean,
    documentName: String,
    documentType: Number,
    documentDate: String,
    createdTime: { 
        type: Date,
        default: Date.now,    
    },
    createdBy : Number,
    FBU: [Number],
    hashTags: [String]
})
var document = mongoose.model('documentdetails', documentSchema);


module.exports = document;