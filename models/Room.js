const mongoose = require("mongoose");



const roomSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    code:{
        type: String,
        required: true,
        unique: true
    },
    organizer:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    participants:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
   ],

   isActivy:{
    type: Boolean,
    default: true
   }
},{timestamps:true});


module.exports = mongoose.model("Room",roomSchema);