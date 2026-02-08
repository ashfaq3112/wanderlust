const express = require("express");
const router = express.Router();
const flash = require("connect-flash");

// Root route
router.get("/", (req, res) => {
    res.send("Hi i am root");
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
