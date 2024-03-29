const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const passport = require('passport')

//login page
router.get("/login", (req, res)=>{
    res.render("login")
})

//register page
router.get("/register", (req, res)=>{
    res.render("register")
})

//register handle
router.post("/register", (req, res)=>{
    const {name ,email , password, password2} = req.body;
    const errors = [];

    //check fields
    if(!name || !email || !password || !password2) errors.push({msg: "PLease fill all fields"})
    //password
    if(password != password2) errors.push({msg: "Password do not match"})


    if(errors.length > 0){
        res.render("register", {errors,name,email,password,password2} )
    }
    else{
        //validation passed
        User.findOne({email : email}).then(user=>{
            if(user){
                //user exists
                errors.push({msg : "Email already registered"})
                res.render("register", {errors,name,email,password,password2} )
            }
            else{
                const newUser = new User({
                    name,
                    email,
                    password
                })
                bcrypt.hash(newUser.password, 10).then(hash=>{
                    newUser.password = hash;

                    newUser.save().then(user=>{
                        req.flash('success_msg','You are now registered');
                        res.redirect("/users/login")
                    }).catch(err=> console.log(err))
                })
                .catch(err=> console.log(err))
            }
        })
    }
})


// Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});


// Logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.flash('success_msg', 'Logged Out Successfully');
        res.redirect('/users/login');
    });
});



module.exports = router;