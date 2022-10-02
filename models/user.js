
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = mongoose.Schema({
    name: String,
    ppc: Number,
    role:{
        type: String,
        enum: ['admin', 'viewer', 'user',]
      },
    password: String,
    created: { 
        type: Date,
        default: Date.now
    },
    isPasswordChanged: Boolean,
    FBU: [Number]
})
var User = mongoose.model('users', userSchema);


module.exports = User;