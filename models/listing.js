const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        default:
            "https://unsplash.com/photos/a-lake-surrounded-by-mountains-and-trees-under-a-cloudy-sky-q_kmIm1TpVU",
        set:(v) =>
           v===""
            ?"https://unsplash.com/photos/a-lake-surrounded-by-mountains-and-trees-under-a-cloudy-sky-q_kmIm1TpVU"
            : v,
    },
    image:{
        url:String,
        filename:String,
    },
    price:Number,
    location:String,
    country:String,
});

const Listing = mongoose.model("Listing",listingSchema);
module.exports = Listing;