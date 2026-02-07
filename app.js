const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride =  require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema, reviewSchema} = require("./schema.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const Review = require("./models/review.js");



main()
    .then(()=>{
        console.log("connected to DB");
    })
    .catch((err)=>{
        console.log(err);
    });

    
async function main(){
    await mongoose.connect(MONGO_URL);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
 
app.get("/",(req,res)=>{      //api
    res.send("Hi i am root");
});

const validateListing = (req,res,next) => {
    const {error} = listingSchema.validate(req.body);
    if (error) {
        throw new ExpressError(error.message, 400);
    }
    next();
}

const validateReview = (req,res,next) => {
    const {error} = reviewSchema.validate(req.body);
    if (error) {
        throw new ExpressError(error.message, 400);
    }
    next();
}
app.get("/listings",wrapAsync(async (req,res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index",{allListings});
}));

//New Route
app.get("/listings/new",(req,res)=>{
    res.render("listings/new.ejs");
});

//show route
app.get("/listings/:id",wrapAsync(async (req,res)=>{
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

//edit route
app.get("/listings/:id/edit",wrapAsync(async (req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError("Listing not found", 404);
    }
    res.render("listings/edit.ejs",{listing});
}));

//update route
app.put("/listings/:id",validateListing, wrapAsync(async(req,res)=>{
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});
    res.redirect(`/listings/${id}`);
}));

//create route
app.post("/listings",validateListing, wrapAsync(async (req,res)=>{
    console.log("Received data:", req.body);
    console.log("Listing data:", req.body.listing);
    
    // Validate that listing data exists and has required fields
    if (!req.body.listing) {
        throw new ExpressError("No listing data provided", 400);
    }
    
    if (!req.body.listing.title || req.body.listing.title.trim() === '') {
        throw new ExpressError("Title is required", 400);
    }
    
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
}));                 


//delete route
app.delete("/listings/:id",wrapAsync(async (req,res)=>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    if (!deletedListing) {
        throw new ExpressError("Listing not found", 404);
    }
    console.log(deletedListing);
    res.redirect("/listings");
}));

//reviews routes - MUST be before error handlers
//post route
app.post("/listings/:id/reviews",validateReview, wrapAsync(async (req,res)=>{
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
    
    res.redirect(`/listings/${id}`);
}));

// delete review route - more specific route must come before general routes
app.delete("/listings/:id/reviews/:reviewId",wrapAsync(async (req,res)=>{
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

// edit review route
app.get("/listings/:id/reviews/:reviewId/edit",wrapAsync(async (req,res)=>{
    let {id, reviewId} = req.params;
    let review = await Review.findById(reviewId);
    if (!review) {
        throw new ExpressError("Review not found", 404);
    }
    res.render("listings/edit-review.ejs",{review, listingId: id});
}));

// 404 handler - must be after all routes
app.use((req,res,next)=>{
    next(new ExpressError("Page Not Found",404));
});

// Error handler - must be after all routes and 404 handler
app.use((err,req,res,next)=>{
    let {statusCode = 500, message = "Something went wrong"} = err;
    console.error("Error:", err);
    console.error("Error message:", message);
    console.error("Error stack:", err.stack);
    res.status(statusCode).render("listings/error.ejs", {err});
});

app.listen(8080,()=>{
    console.log("server is running to port 8080");
});