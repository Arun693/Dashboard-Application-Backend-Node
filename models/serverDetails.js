
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var serverInfoSchema = mongoose.Schema({
    channelID: Number,
    application:  {
        type: Schema.Types.ObjectId,
        ref: 'applicationtypes',
    },
    publicDCIP: String,
    publicDRIP: String,
    publicUATIP: String,
    publicDomainLive: String,
    publicDomainUAT: String,
    serverArray: [{
        serverName: String,
        liveIP: String,
        drIP: String,
        uatIP : String,
        externalDependencyIp: String
    }],
    createdTime: { 
        type: Date,
        default: Date.now,    
    },
    lastUpdateBy : Number
})
var serverInfo = mongoose.model('serverinfo', serverInfoSchema);


module.exports = serverInfo;