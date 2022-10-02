var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var appNamesSchema = mongoose.Schema({
    id: Number,
    name: String,
    channelID: Number
})
var AppNames = mongoose.model('applicationtypes', appNamesSchema);


module.exports = AppNames;