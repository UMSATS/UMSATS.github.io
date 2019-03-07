const Comment = require("../models/comment");
const ADMIN = "5c80b5a2d77ebb55ec560393";
const EMAIL = "skymailsenter@gmail.com";
const EMAIL_PASS = "Mambahuyamba9300909google";

module.exports = {

    // EMAILS
    EMAIL: EMAIL,
    EMAIL_PASS: EMAIL_PASS,

    // ADMIN ID for superuser verification
    ADMIN: ADMIN,

    //-----------
    // MIDDLEWARE
    //-----------

    isLoggedIn: function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
},
    isLoggedAdmin: function(req, res, next) {
        if(req.isAuthenticated()){
            if(req.user._id == ADMIN){
                return next();
            }
        }
        res.redirect("/items");
    },
    checkCommentOwnership: function (req, res, next){
        if(req.isAuthenticated()){
            Comment.findById(req.params.comment_id, function(err, comment) {
                if(err){
                    console.log(err);
                    res.redirect("back");
                } else {
                    if(
                        comment.author.id.equals(req.user._id) ||
                        req.user._id == ADMIN
                    ){
                        next();
                    } else {
                        res.redirect("back");
                    }
                }
            });
        } else {
            res.redirect("/login");
        }
    }
}

