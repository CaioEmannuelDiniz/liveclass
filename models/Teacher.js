const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true },
    room: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Room",
        unique: true 
    }
});

const Teacher = mongoose.model("Teacher",teacherSchema);
module.exports = Teacher;