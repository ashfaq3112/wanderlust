const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");

// Signup form
router.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

// Register new user
router.post("/signup", async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash("error", "A user with this email is already registered. Please use a different email or login.");
            return res.redirect("/signup");
        }
        
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);

        // Log the user in immediately after successful registration
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "User registered successfully!");
            res.redirect("/listings");
        });
    } catch (err) {
        // Handle specific errors
        if (err.name === "UserExistsError") {
            req.flash("error", "A user with this email is already registered. Please use a different email or login.");
        } else if (err.name === "ValidationError") {
            req.flash("error", "Please fill in all required fields correctly.");
        } else {
            req.flash("error", err.message || "Registration failed. Please try again.");
        }
        
        res.redirect("/signup");
    }
});

// Login form
router.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

// Login user
router.post("/login", (req, res, next) => {
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true
    })(req, res, (err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "Logged in successfully!");
        // Redirect to originally requested page (e.g., /listings/new) or fallback to all listings
        const redirectUrl = req.session.returnTo || "/listings";
        delete req.session.returnTo;
        res.redirect(redirectUrl);
    });
});

// Logout
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "Logged out successfully!");
        res.redirect("/listings");
    });
});

module.exports = router;