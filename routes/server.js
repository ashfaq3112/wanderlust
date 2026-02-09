const express = require("express");
const router = express.Router();
const flash = require("connect-flash");
const Listing = require("../models/listing.js");

// Root route - Home page with icons and listings
router.get("/", async (req, res) => {
    try {
        const allListings = await Listing.find({});
        res.render("home", { allListings });
    } catch (error) {
        console.error("Error fetching listings for home page:", error);
        res.render("home", { allListings: [] });
    }
});

// Session test: visit /session-test to set a value, visit again to see it persist
router.get("/session-test", (req, res) => {
    if (!req.session.visitCount) req.session.visitCount = 0;
    req.session.visitCount += 1;
    res.send(`Session is working! You have visited this page ${req.session.visitCount} time(s). Session ID: ${req.sessionID}`);
});

// Optional: health check (useful for deployment/monitoring)
router.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Server is running" });
});

module.exports = router;
