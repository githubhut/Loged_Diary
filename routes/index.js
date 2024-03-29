const express = require("express");
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
const Posts = require("../models/post");
const _ = require("lodash");

router.get("/", (req, res)=>{
    res.render("welcome");
})

router.get("/dashboard", ensureAuthenticated, async (req, res)=>{
    const pst = await Posts.find();

    res.render("dashboard", {name : req.user.name, post : pst});
})

router.get("/compose", ensureAuthenticated, (req, res)=>{
    res.render("compose");
})
router.post("/compose", async (req, res)=>{
    let inputTitle = req.body.Title;
    let inputPost = req.body.post;
    let flag = 0;
    const distinctTitles = await Posts.find().distinct('title');
    distinctTitles.forEach(async (element) => {
        if(_.lowerCase(element) === _.lowerCase(inputTitle)){
            flag  = 1;
        }
    });
    
    if(flag === 1){
        req.flash('title_msg','Title Already Exists');
        res.redirect("/compose")
    }
    else{

        try {
            // Create a new item using the Mongoose model
            const newitem = new Posts({
                title : inputTitle,
                content: inputPost
            })
    
            // Save the item to the database
            await newitem.save();
    
            res.redirect("/dashboard");
        } catch (error) {
            if (error.code === 11000) {
              console.error('Duplicate key error. Title must be unique.');
            } else {
              console.error('Error saving item:', error);
            } 
        }
    }

})
router.get("/posts/:postName", ensureAuthenticated, async (req, res)=>{
    let requredTitle = req.params.postName;

    const distinctTitles = await Posts.find().distinct('title');
    distinctTitles.forEach(async (element) => {
        if(_.lowerCase(element) == _.lowerCase(requredTitle)){
            const p = await Posts.findOne({ title: element });
            res.render("post", {
                title : element,
                content : p.content
            })
        }
    });
    
})

module.exports = router;