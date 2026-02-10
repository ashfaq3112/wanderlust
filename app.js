const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const fs = require('fs');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
console.log('Looking for .env at:', envPath);
console.log('.env file exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    console.log('.env file content:');
    console.log(fs.readFileSync(envPath, 'utf8'));
}

require('dotenv').config({ path: envPath });

// Debug: Check if environment variables are loaded
console.log('CLOUD_NAME:', process.env.CLOUD_NAME);
console.log('CLOUD_API_KEY:', process.env.CLOUD_API_KEY ? 'Found' : 'Not found');
console.log('CLOUD_API_SECRET:', process.env.CLOUD_API_SECRET ? 'Found' : 'Not found');
console.log('DB_URL:', process.env.DB_URL ? 'Found' : 'Not found');

// const MONGO_URL = process.env.DB_URL || "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.DB_URL
const listingRoutes = require("./routes/listing.js");
const reviewRoutes = require("./routes/review.js");
const serverRoutes = require("./routes/server.js");
const userRoutes = require("./routes/user.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const listings = require("./models/listing.js");
const reviews = require("./models/review.js");

main()
    .then(()=>{
        console.log("connected to DB");
    })
    .catch((err)=>{
        console.log(err);
    });

    
async function main(){
    await mongoose.connect(dbUrl);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const sessionOptions = {
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    httpOnly:true,
};
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Temporarily ignore password correctness: log in any existing user by username or email
passport.use(new LocalStrategy(
    {
        usernameField: "username",
        passwordField: "password"
    },
    async (username, password, done) => {
        try {
            const user = await User.findOne({
                $or: [{ username }, { email: username }]
            });

            if (!user) {
                return done(null, false, { message: "No user found with that username or email" });
            }

            // IMPORTANT: skipping password check on purpose (as requested)
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Make the current user and flash messages available in all views
app.use((req, res, next) => {
    res.locals.currUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

app.get("/demoUser",async(req,res)=>{
    let user = await User.register(new User({email:"yaseen@gmail.com"}),"yaseen123");
    res.send(user);
    
})

app.use("/", serverRoutes);
app.use("/listings", listingRoutes);
app.use("/listings", reviewRoutes);
app.use("/", userRoutes);
// 404 handler - must be after all routes
app.use((req,res,next)=>{
    next(new ExpressError("Page Not Found",404));
});

// Error handler - must be after all routes and 404 handler
app.use((err,req,res,next)=>{
    let {statusCode = 500, message = "Something went wrong"} = err;
    // Only log non-404 errors to reduce console noise
    if (statusCode !== 404) {
        console.error("Error:", err);
        console.error("Error message:", message);
        console.error("Error stack:", err.stack);
    }
    res.status(statusCode).render("listings/error.ejs", {err});
});

app.listen(8080,()=>{
    console.log("server is running to port 8080");
});