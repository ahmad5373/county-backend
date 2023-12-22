const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
            // 1: Super Admin
            // 2: Admin
            // 3: User
        type: Number,
        enum: [1,2,3], //enum: Specifies the allowed values for the role 
        required:true,
    },
    status: {
        type: Boolean,
        default: true
    },
    deleted: {
        type: Boolean,
        default: false
    },
    resetPasswordToken:{
        type: String,
    },
    resetPasswordExpire:{
        type: String,
    },
},
{ timestamps: true }
);

const User = mongoose.model('User', UserSchema);

module.exports = User;
