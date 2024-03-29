require('dotenv').config();
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const flash = require('connect-flash');
const session = require('express-session');
const passport = require("passport")
const _ = require("lodash");

const app = express();
// Passport Config
require('./config/passport')(passport);

//ejs
app.use(expressLayouts);
app.set("view engine", "ejs");

//to use my css file
app.use(express.static("public"));

//bodyparser
app.use(express.urlencoded({extended: true}));

// Express session
app.use(
    session({
      secret: 'my_secret',
      resave: true,
      saveUninitialized: true
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.tilte_msg = req.flash('title_msg');
    res.locals.error = req.flash('error');
    next();
});

//db
mongoose.connect(process.env.MONGODB_URI).then(()=>{
    console.log("Mongodb Connected")
}).catch(()=>{
    console.log("Mongodb Not Connected")
})

//routes
app.use("/", require("./routes/index"));
app.use("/users", require("./routes/users"));


app.listen(3000,() => {
    console.log(`Server is running on port 3000`);}
)