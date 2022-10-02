
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var hashTags = mongoose.Schema({
    fbu: Number | String,
    //hashTag: String,
    hashTag:  {
        type: String,
        validate: {
          validator: function(v, cb) {
            this.constructor.find({hashTag: v}, function(err,docs){
               cb(docs.length == 0);
            });
          },
          message: 'User already exists!'
        }
      },
    createdTime: { 
        type: Date,
        default: Date.now,    
    },
    createdBy : Number | String
})
var hashTags = mongoose.model('hashtags', hashTags);


module.exports = hashTags;