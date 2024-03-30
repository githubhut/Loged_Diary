const express = require("express");
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
const Posts = require("../models/post");
const CommonPost = require("../models/commonpost");
const _ = require("lodash");

router.get("/", (req, res)=>{
    res.render("welcome");
})

router.get("/dashboard", ensureAuthenticated, async (req, res)=>{
    try {
        const userPosts = await Posts.find({ userId: req.user.id });
        res.render("dashboard", { name: req.user.name, post: userPosts });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.get("/common_post", ensureAuthenticated, async (req, res)=>{
    try {
        const CPosts = await CommonPost.find().populate('userId');
        res.render("common_dashboard", { name: req.user.name, post: CPosts });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


router.get("/compose", ensureAuthenticated, (req, res)=>{
    res.render("compose");
})

router.post("/compose", ensureAuthenticated, async (req, res) => {
    try {
        const inputTitle = req.body.Title;
        const inputPost = req.body.post;
        const postType = req.body.postType;

        if (postType === 'common') {
            // Create a new CommonPost
            const existingPost = await CommonPost.findOne({ title: inputTitle});
            if (existingPost) {
                req.flash("title_msg", "A post with the same title already exists.");
                return res.redirect("/compose");
            }
            const newCommonPost = new CommonPost({
                title: inputTitle,
                content: inputPost,
                userId: req.user.id
            });
            await newCommonPost.save();
        } else {
            // Create a new Post
            const existingPost = await Posts.findOne({ title: inputTitle, userId: req.user.id });
            if (existingPost) {
                req.flash("title_msg", "A post with the same title already exists.");
                return res.redirect("/compose");
            }
            const newPost = new Posts({
                title: inputTitle,
                content: inputPost,
                userId: req.user.id
            });
            await newPost.save();
        }
        res.redirect("/dashboard");
    } catch (error) {
        console.error('Error saving post:', error);
        res.status(500).send('Internal Server Error');
    }
});



router.get("/posts/:postName", ensureAuthenticated, async (req, res)=>{
    const requiredTitle = req.params.postName;

    try {
        const Post = await Posts.findOne({ title: requiredTitle });

        if (Post) {
            res.render("post", {
                title: Post.title,
                content: Post.content
            });
        } else {
            res.status(404).send("Common post not found");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
    
})

router.get("/common_post/:postName", ensureAuthenticated, async (req, res) => {
    const requiredTitle = req.params.postName;

    try {
        const commonPost = await CommonPost.findOne({ title: requiredTitle });

        if (commonPost) {
            res.render("post", {
                title: commonPost.title,
                content: commonPost.content
            });
        } else {
            res.status(404).send("Common post not found");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});


module.exports = router;


