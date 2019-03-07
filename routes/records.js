const express = require("express"),
    router = express.Router(),
    Item = require("../models/item"),
    Record = require("../models/record"),
    User = require("../models/user");

// middleware
const myFunc = require('../exports/exports'),
    isLoggedIn = myFunc.isLoggedIn;

//------------
// TAKE ROUTES
//------------

//take an item
router.post('/take', isLoggedIn, function (req, res){
    Item.findById(req.params.id).exec(function(err, item){
        if(err){
            console.log("Item: " + req.params.id + " was not found");
        } else {
            if(!item.availability){
                console.log("Item " + item.name + " is unavailable");
            } else {
                Record.create({dateTaken: new Date()}, function(err, record){
                    if(err){
                        console.log("Could not create a take event!");
                        res.redirect('/login');
                    } else {
                        record.user.id = req.user._id;
                        record.user.username = req.user.username;
                        record.item.id = item._id;
                        record.item.name = item.name;
                        record.dateReturn = new Date(req.body.dateReturn);
                        record.returned = false;
                        record.save();

                        item.records.push(record);
                        item.availability = false;
                        item.save();

                        User.findById(req.user._id, function (err, user){
                            if(err){
                                console.log("failed to search a user" + req.user._id);
                            } else {
                                user.records.push(record);
                                user.save();
                            }
                        });
                    }
                });
            }
        }
    });
    res.redirect("/items");
});

// return item
router.put("/return", isLoggedIn, function(req, res){
    records.findOne({
        user: {
            id: req.user._id
        },
        item: {
            id: req.params.id
        },
        returned: false,
    }, function(err, record){
        if(err){
            console.log("Could not find record");
        }  else {
            record.dateReturn = new Date();
            record.returned = true;
            record.save();

            Item.finById(req.params.id, function(err, item){
                if(err){
                    console.log("Could not find item: " + req.params.id);
                } else {
                    item.availability = true;
                    item.save();
                }
            });
        }
    });
});

module.exports = router;