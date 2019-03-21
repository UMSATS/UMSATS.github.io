const express = require("express"),
    router = express.Router(),
    Item = require("../models/item"),
    Record = require("../models/record"),
    User = require("../models/user"),
    fs = require('fs'),
    nodemailer = require("nodemailer"),
    flash = require('express-flash-notification');

// storage
const multer = require("multer"),
    fileFilter = function(req, file, cb){
        if(file.mimeType === 'image/jpeg' || file.mimeType === 'image/png'){
            cb(null, true);
        } else {
            cb(null, false);
            console.log('File rejected');
        }
    },
    storage = multer.diskStorage({
        destination: function(req, res, cb){
            cb(null, './views/static/assets/items/');
        },
        filename: function(req, file, cb){
            cb(null, req.body.item.name + '.' + file.originalname.split('.')[1]);
        }
    }),
    upload = multer({
        storage: storage,
        limits: {
            fileSize: 1024 * 1024 * 5
        }
    });

// middleware and constants
const myFunc = require('../exports/exports'),
    isLoggedIn = myFunc.isLoggedIn,
    isLoggedAdmin = myFunc.isLoggedAdmin,
    EMAIL = myFunc.EMAIL,
    EMAIL_PASS = myFunc.EMAIL_PASS;


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL,
        pass: EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }

});

//-------------
// ITEMS ROUTES
//-------------

// show create new item admin page
router.get("/newItem", isLoggedAdmin, function(req, res){
    res.render("Items/newItem");
});

// show all items
router.get("/", isLoggedIn, function(req, res){
    Item.find({}, function(err, items){
       if(err){
            console.log(err);
       } else {
            res.render("Items/items", {items: items});
       }
    });
});

// show complete info
router.get("/:id", isLoggedIn, function(req, res) {
    Item.findById(req.params.id)
        .populate("records")
        .populate("comments")
        .exec(function(err, item){
        if(err){
            console.log(err);
        } else {

            // increment the number of visits
            item.statistics.visitsThisMonth++;
            item.save();

            res.render("Items/show", {item: item});
        }
    });
});

// search route
router.post("/search", isLoggedIn, function(req, res){
     var superString = ".*" + req.body.searchKey + ".*";

     Item.find(
         {
             "$or": [
                 {name: {$regex: superString, $options: "i"}},
                 {description: {$regex: superString, $options: "i"}}
             ]
         }
     , function(err, items){
         if(err){
             console.log(err);
         } else {
             res.render("Items/items", {items: items});
         }
     });
});

//post new item
router.post("/", isLoggedAdmin, upload.single('image'), function(req, res){
    Item.create(req.body.item, function(err, newItem){
        if(err){
            console.log(err);
        } else {
            // initialising all the fields
            newItem.availability = true;
            newItem.image.path = req.file.path;
            newItem.category = req.body.category;
            newItem.image.contentType = req.file.mimeType;
            newItem.statistics.visitsThisMonth = 0;
            newItem.statistics.takenThisMonth = 0;
            for(let i = 0; i < 12; i++){
                newItem.statistics.yearLog.visits.push(0);
                newItem.statistics.yearLog.wasTaken.push(0);
            }
            //(req.protocol + '://' + req.get('host') + req.originalUrl + newItem._id)
            newItem.save();
            console.log("Item created: " + newItem.name);
        }
    });
    res.redirect("/items");
});

//------------
// EDIT ROUTES
//------------

// show edit page
router.get("/:id/edit", isLoggedAdmin, function(req, res){
    Item.findById(req.params.id, function(err, found){
        if(err){
            console.log(err);
            res.redirect("/items");
        } else {
            res.render("Items/edit", {item: found});
        }
    });
});

// update item
router.put("/:id", isLoggedAdmin, upload.single('image'), function(req, res){

    var update = {
        name: req.body.item.name,
        image: {path: req.file.path, mimetype: req.file.mimeType },
        description: req.body.item.description
    };

    Item.findByIdAndUpdate(req.params.id, update, function(err, updated){
        if(err){
            console.log(err);
            res.redirect("/items");
        } else {
            console.log("Item Updated: " + updated.name);
            res.redirect("/items/" + updated._id);
        }
    })
});

// destroy item
router.delete("/:id", isLoggedAdmin, function(req, res){
    Item.findById(req.params.id, function(err, toRemove){
        if(err){
            console.log(err);
        } else {
            let nameRemoved = toRemove.name;
            fs.unlinkSync(toRemove.image.path);
            toRemove.remove();
            console.log("Item deleted: " + nameRemoved);
        }
        res.redirect("/items");
    });
});

//------------
// TAKE ROUTES
//------------

//take an item
router.post('/:id/take', isLoggedIn, function (req, res){
    Item.findById(req.params.id).exec(function(err, item){
        if(err){
            console.log("Item: " + req.params.id + " was not found");
            res.redirect("/items");
        } else {
            if(!item.availability){
                console.log("Item " + item.name + " is unavailable");
            } else {
                Record.create({dateTaken: new Date()}, function(err, record){
                    if(err){
                        console.log("Could not create a take event!");
                        res.redirect('/login');
                    } else {
                        // updating record
                        record.user.id = req.user._id;
                        record.user.username = req.user.username;
                        record.user.email = req.user.email;
                        record.item.id = item._id;
                        record.item.name = item.name;
                        record.dateReturn = new Date(req.body.dateReturn);
                        record.returned = false;
                        record.save();

                        // updating item
                        item.availability = false;
                        item.records.push(record);
                        item.statistics.takenThisMonth++;
                        item.save();

                        // updating user
                        User.findById(req.user._id, function (err, user){
                            if(err){
                                console.log("failed to search a user" + req.user._id);
                            } else {
                                user.records.push(record);
                                user.numTaken++;
                                user.save();
                            }
                        });
                        console.log("Item " + item.name + " was taken!");

                        //sendEmail('take', record);
                    }
                });
            }
        }
    });
    res.redirect("/items/" + req.params.id);
});

// return item
router.put("/:id/return", isLoggedIn, function(req, res){
    Item.findById(req.params.id).populate("records").exec(function(err, item){
        if(err){
            console.log(err);
        } else {
            if(item.availability){
                console.log("Item " + item.name + " does not need to be returned");
            } else {
                User.findById(req.user._id, function(err, user){
                    if(err){
                        console.log(err);
                    } else {
                        // suppose the latest recors is the unreturned one
                        var record = item.records[item.records.length - 1];
                        var currDate = new Date();

                        if(currDate > record.dateReturn){
                            user.numLateReturns++;
                            user.save();
                            console.log("Late return! User: " + user.username);
                        }

                        record.dateReturn = currDate;
                        record.returned = true;
                        record.save();

                        item.availability = true;
                        item.save();

                        console.log("Item " + item.name + " was returned!");
                    }
                });
            }
        }
        res.redirect("/items/" + req.params.id);
    });
});

function sendEmail(param, record){
    var subject;
    var text;
    switch (param) {
        case 'take':
           subject = 'You\'e taken ' + record.item.name + 'from UMSATS';
           text = 'This is the automatically generated email send as a confirmation that you, ' + record.user.username + ' have taken'
                + record.item.name + 'form UMSATS storage.' + '\nThis item is expected to be returned ' + record.dateReturn
                + '. Don\'t forget to bring it back!';
           break;
        default:
            console.log("unknown parameter. Could not send email");
            break;
    }

    if(subject != null && text != null){
        var mailOptions = {
            from: EMAIL,
            to: record.user.email,
            subject: subject,
            text: text
        }
    };

    transporter.sendMail(mailOptions, function(err, info){
        if(err){
            console.log(err);
        } else {
            console.log('Email confirmation was sent to: ' + record.user.username);
        }
    });
}

module.exports = router;