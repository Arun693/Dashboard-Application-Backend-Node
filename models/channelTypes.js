var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var channeltypesSchema = mongoose.Schema({
    id: Number,
    name: String
})
var TypesNames = mongoose.model('channeldetails', channeltypesSchema);


module.exports = TypesNames;