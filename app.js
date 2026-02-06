const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride =  require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema} = require("./schema.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";



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
    console.log("Listing image:", listing.image);
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

// 404 handler - must be after all routes
app.use((req,res,next)=>{
    next(new ExpressError("Page Not Found",404));
});

// Error handler - must be after all routes and 404 handler
app.use((err,req,res,next)=>{
    let {statusCode = 500, message = "Something went wrong"} = err;
    res.render("listings/error.ejs");
});

app.listen(8080,()=>{
    console.log("server is running to port 8080");
});