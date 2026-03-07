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
    teacher:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        required: true,
        unique: true
    },
    students:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Student"
    }
   ],
   isActive :{
    type: Boolean,
    default: true
   }
},{timestamps:true});


const Room = mongoose.model("Room",roomSchema);
module.exports = Room;