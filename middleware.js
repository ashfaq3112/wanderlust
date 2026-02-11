const { listingSchema, reviewSchema } = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");
const Listing = require("./models/listing.js");

const validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        throw new ExpressError(error.message, 400);
    }
    next();
};

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        throw new ExpressError(error.message, 400);
    }
    next();
};

// Authentication middleware: ensure user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    // Remember the original URL to redirect after login
    req.session.returnTo = req.originalUrl;
    req.flash("error", "You must be logged in first!");
    return res.redirect("/login");
};

// Authorization middleware: only the owner of a listing can edit/delete it
const isListingOwner = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        throw new ExpressError("Listing not found", 404);
    }

    // Allow everyone to try, but only owner can actually edit/delete
    if (!req.user || !listing.owner || !listing.owner.equals(req.user._id)) {
        req.flash("error", "Only the owner can edit or delete this listing.");
        return res.redirect(`/listings/${id}`);
    }

    // Attach listing for downstream handlers if needed
    res.locals.listing = listing;
    next();
};

module.exports = { validateListing, validateReview, isLoggedIn, isListingOwner };
