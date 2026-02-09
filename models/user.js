const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { default: passportLocalMongoose } = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    }
});

// Add username+password fields and helper methods
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
