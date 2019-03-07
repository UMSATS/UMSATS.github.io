var mongoose = require("mongoose");

// Record
var RecordSchema = new mongoose.Schema({
    user: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
        email: String
    },
    item: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Record"
        },
        name: String
    },
    returned: Boolean,
    dateTaken: Date,
    dateReturn: Date
});

module.exports = mongoose.model("Record", RecordSchema);