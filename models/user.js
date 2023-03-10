const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:false
    },
    lastname:{
        type:String,
        required:false
    },
    gender:{
        type:String,
        required:false
    },
    email:{
        type: String,
        required:false
    },
    phone:{
        type: String,
        required:false
    },
    wallet:{
        type: Number,
        default:0
    },
    active:{
        type: Boolean,
        required: false
    },
    password:{
        type: String,
        required:false
    }
})


// Create a collection
const UsersModel = new mongoose.model('users',userSchema);

module.exports = UsersModel;