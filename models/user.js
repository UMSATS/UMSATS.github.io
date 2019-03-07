var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    records: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Record",
        }
    ],
    numTaken: Number,
    numLateReturns: Number
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);