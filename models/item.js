var mongoose = require("mongoose");

// Item
var ItemSchema = new mongoose.Schema({
    name: String,
    category: String,
    description: String,
    image: {path: String, mimeType: String},
    availability: Boolean,
    statistics: {
        visitsThisMonth: Number,
        takenThisMonth: Number,
        yearLog: {
            visits: [],
            wasTaken: []
        }
    },
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

    // locatiuon, quantity, individual id (quantity), separate return, ont time use items

});

module.exports = mongoose.model("Item", ItemSchema);