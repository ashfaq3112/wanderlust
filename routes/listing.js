const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const { validateListing, validateReview, isLoggedIn, isListingOwner } = require("../middleware.js");

// Index - all listings
router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings });
}));

// New - form to create listing (login required)
router.get("/new", isLoggedIn, (req, res) => {
    res.render("listings/new.ejs");
});

// Create - POST new listing (login required)
router.post("/", isLoggedIn, validateListing, wrapAsync(async (req, res) => {
    if (!req.body.listing) {
        throw new ExpressError("No listing data provided", 400);
    }
    if (!req.body.listing.title || req.body.listing.title.trim() === "") {
        throw new ExpressError("Title is required", 400);
    }
    const newListing = new Listing(req.body.listing);
    // Attach current user as owner
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success", "New listing created successfully!");
    res.redirect("/listings");
}));

// Show - single listing
router.get("/:id", wrapAsync(async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate("owner").populate({
        path: "reviews",
        populate: {
            path: "author",
            model: "User"
        }
    });
    if (!listing) {
        throw new ExpressError("Listing not found", 404);
    }
    
    // Ensure reviews is always an array
    if (!Array.isArray(listing.reviews)) {
        listing.reviews = [];
    }
    
    const isOwner = req.user && listing.owner && listing.owner._id && listing.owner._id.equals(req.user._id);
    
    res.render("listings/show.ejs",{listing, isOwner, currentUser: req.user});
}));

// Edit - form to edit listing (login + ownership required)
router.get("/:id/edit", isLoggedIn, isListingOwner, wrapAsync(async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError("Listing not found", 404);
    }
    res.render("listings/edit.ejs",{listing});
}));

// Update listing (login + ownership required)
router.put("/:id", isLoggedIn, isListingOwner, validateListing, wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
}));

// Delete listing (login + ownership required)
router.delete("/:id", isLoggedIn, isListingOwner, wrapAsync(async (req, res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    if (!deletedListing) {
        throw new ExpressError("Listing not found", 404);
    }
    console.log(deletedListing);
    req.flash("error", `"${deletedListing.title}" listing deleted successfully!`);
    res.redirect("/listings");
}));

module.exports = router;