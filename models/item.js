var mongoose = require("mongoose");

// Item
var ItemSchema = new mongoose.Schema({
    name: String,
    image: {path: String, mimeType: String},
    description: String,
    availability: Boolean,
    records: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Record",
        }
    ],
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]

});

module.exports = mongoose.model("Item", ItemSchema);