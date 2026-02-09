const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

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
    // Reference to the user who owns/created this listing
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    reviews:[{
        type:Schema.Types.ObjectId,
        ref:"Review",
        default: []
    }],
}, {
    strictPopulate: false
});

listingSchema.post("findOneAndDelete", async function(doc) {
    if (doc) {
        await Review.deleteMany({
            _id: { $in: doc.reviews }
        });
    }
});
const Listing = mongoose.model("Listing",listingSchema);
module.exports = Listing;