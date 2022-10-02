var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var documenttypesSchema = mongoose.Schema({
    id: Number,
    name: String
})
var TypesNames = mongoose.model('documenttypes', documenttypesSchema);


module.exports = TypesNames;