const express = require("express");
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
const Posts = require("../models/post");
const CommonPost = require("../models/commonpost");
const User = require("../models/user")

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
    const requiredId = req.params.postName;
    const userid = req.user._id;
    try {
        const Post = await Posts.findOne({ _id: requiredId, userId: userid });

        if (Post) {
            res.render("post", {
                title: Post.title,
                content: Post.content
            });
        } else {
            res.status(404).send("Private post not found");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
    
})

router.get("/common_post/:postName", ensureAuthenticated, async (req, res) => {
    const requiredId = req.params.postName;
    try {
        const commonPost = await CommonPost.findOne({ _id: requiredId});

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



router.get('/updatePost/:postId', ensureAuthenticated, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user._id;

        const post = await CommonPost.findById(postId);
        if (!post) {
            req.flash('error_msg', 'Post not found');
            res.redirect('/common_post');
        }

        else if (post.userId.toString() !== userId.toString()) {
            req.flash('error_msg', 'You are not authorized to update this post');
            res.redirect('/common_post');
        }

        else res.render('updateCommon', { post });
    } catch (error) {
        req.flash('error_msg', "Cannot Update: "+error.name);
        console.error('Error rendering update form:', error);
        res.redirect('/common_post');
    }
});

router.post('/updatePost/:postId', ensureAuthenticated, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user._id;
        const { title, content } = req.body;

        const post = await CommonPost.findById(postId);
        if (!post) {
            req.flash('error_msg', 'Post not found');
            res.redirect('/common_post');
        }

        if (post.userId.toString() !== userId.toString()) {
            req.flash('error_msg', 'You are not authorized to update this post');
            res.redirect('/common_post');
        }

        const newpost = await CommonPost.find({ title: title });

        if(newpost.length > 1 || (newpost.length === 1 && postId.toString() != newpost[0]._id.toString())){
            req.flash('error_msg', 'Title Already Exists');
            res.redirect('/common_post');
        }
        else {
            post.title = title;
            post.content = content;

            await post.save();
    
            req.flash('success_msg', 'Post updated successfully');
            res.redirect('/common_post');
        }
    } catch (error) {
        req.flash('error_msg', "Cannot Update: "+error.name);
        console.error('Error updating post:', error);
        res.redirect('/common_post');
    }
});



router.get('/updatePrivatePost/:postId', ensureAuthenticated, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user._id;

        const post = await Posts.findById(postId);
        if (!post) {
            req.flash('error_msg', 'Post not found');
            res.redirect('/dashboard');
        }

        else if (post.userId.toString() !== userId.toString()) {
            req.flash('error_msg', 'You are not authorized to update this post');
            res.redirect('/dashboard');
        }

        else res.render('updatePrivate', { post });
    } catch (error) {
        req.flash('error_msg', "Cannot Update: "+error.name);
        console.error('Error rendering update form:', error);
        res.redirect('/dashboard');
    }
});

router.post('/updatePrivatePost/:postId', ensureAuthenticated, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user._id;
        const { title, content } = req.body;

        const post = await Posts.findById(postId);
        if (!post) {
            req.flash('error_msg', 'Post not found');
            res.redirect('/dashboard');
        }

        if (post.userId.toString() !== userId.toString()) {
            req.flash('error_msg', 'You are not authorized to update this post');
            res.redirect('/dashboard');
        }
        const newpost = await Posts.find({ title: title , userId: userId});
        if(newpost.length > 1 || (newpost.length === 1 && postId.toString() != newpost[0]._id.toString())){
            req.flash('error_msg', 'Title Already Exists');
            res.redirect('/dashboard');
        }
        else{

            post.title = title;
            post.content = content;
            await post.save();
            req.flash('success_msg', 'Post updated successfully');
            res.redirect('/dashboard');
        }

    } catch (error) {
        req.flash('error_msg', "Cannot Update: "+error.name);
        console.error('Error updating post:', error);
        res.redirect('/dashboard');
    }
});



module.exports = router;


