const mongoose = require("mongoose");
const hashPassword = require("../utils/hashPassword");

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
    password:{
        type: String,
        required: true
    },
    rooms: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room"
    }]
});


// Ele intercepta o comando .save() antes de chegar ao banco e faz a criptografia da senha 
studentSchema.pre("save", hashPassword);

const Student = mongoose.model("Student", studentSchema);
module.exports = Student;