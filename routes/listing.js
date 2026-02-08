const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const { validateListing, validateReview } = require("../middleware.js");

// Index - all listings
router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings });
}));

// New - form to create listing
router.get("/new", (req, res) => {
    res.render("listings/new.ejs");
});

// Create - POST new listing
router.post("/", validateListing, wrapAsync(async (req, res) => {
    if (!req.body.listing) {
        throw new ExpressError("No listing data provided", 400);
    }
    if (!req.body.listing.title || req.body.listing.title.trim() === "") {
        throw new ExpressError("Title is required", 400);
    }
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    req.flash("success", "New listing created successfully!");
    res.redirect("/listings");
}));

// Show - single listing
router.get("/:id", wrapAsync(async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError("Listing not found", 404);
    }
    
    // Populate reviews if they exist
    if (listing.reviews && listing.reviews.length > 0) {
        try {
            await listing.populate("reviews");
        } catch (populateError) {
            console.log("Populate error:", populateError.message);
            listing.reviews = [];
        }
    } else {
        listing.reviews = [];
    }
    
    // Ensure reviews is always an array
    if (!Array.isArray(listing.reviews)) {
        listing.reviews = [];
    }
    
    res.render("listings/show.ejs",{listing});
}));

// Edit - form to edit listing
router.get("/:id/edit", wrapAsync(async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError("Listing not found", 404);
    }
    res.render("listings/edit.ejs",{listing});
}));

// Update listing
router.put("/:id", validateListing, wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
}));

// Delete listing
router.delete("/:id", wrapAsync(async (req, res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    if (!deletedListing) {
        throw new ExpressError("Listing not found", 404);
    }
    console.log(deletedListing);
    req.flash("error", `"${deletedListing.title}" listing deleted successfully!`);
    res.redirect("/listings");
}));

// Reviews (nested under listing)
// Create review
router.post("/:id/reviews", validateReview, wrapAsync(async (req, res) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError("Listing not found", 404);
    }
    
    // Ensure reviews array exists
    if (!listing.reviews) {
        listing.reviews = [];
    }
    
    let newReview = new Review(req.body.review);
    await newReview.save();
    console.log("New review saved:", newReview);
    
    listing.reviews.push(newReview._id);
    await listing.save();
    console.log("Listing updated with review. Total reviews:", listing.reviews.length);
    
    req.flash("success", "Review submitted successfully!");
    res.redirect(`/listings/${id}`);
}));

// Delete review
router.delete("/:id/reviews/:reviewId", wrapAsync(async (req, res) => {
    let {id, reviewId} = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError("Listing not found", 404);
    }
    
    // Remove review from listing
    listing.reviews = listing.reviews.filter(review => review.toString() !== reviewId);
    await listing.save();
    
    // Delete the review
    await Review.findByIdAndDelete(reviewId);
    console.log("Review deleted:", reviewId);
    
    res.redirect(`/listings/${id}`);
}));

// Edit review - form
router.get("/:id/reviews/:reviewId/edit", wrapAsync(async (req, res) => {
    let {id, reviewId} = req.params;
    let review = await Review.findById(reviewId);
    if (!review) {
        throw new ExpressError("Review not found", 404);
    }
    res.render("listings/edit-review.ejs",{review, listingId: id});
}));

module.exports = router;