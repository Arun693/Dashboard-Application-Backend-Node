var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var incidentDetailSchema = mongoose.Schema({
    application: String,
    fbu: String,
    issue: String,
    occurrence: String,
    rca: String,
    requestType: String,
    durationArray: [{
        fromTime: String,
        toTime: String,
    }],
    crfNumber: String,
    staffList: [{
        type: Schema.Types.ObjectId,
        ref: 'users',
    }],
    createdTime: { 
        type: Date,
        default: Date.now,    
    },
    createdBy : Number
})
var incident = mongoose.model('incidentdetails', incidentDetailSchema);


module.exports = incident;