const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,

        required: true, 
    },
    rooms: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room"
    }]
});

const Student = mongoose.model("Student", studentSchema);
module.exports = Student;