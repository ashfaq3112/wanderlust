const Joi = require("joi");

// Define the listing schema
const listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        image: Joi.alternatives().try(
            Joi.string(),
            Joi.object({
                url: Joi.string().allow(''),
                filename: Joi.string().allow('')
            })
        ).optional(),
        price: Joi.number().required().min(0),
        location: Joi.string().required(),
        country: Joi.string().required(),
    }).required(),
});


const reviewSchema = Joi.object({
    review: Joi.object({
        comment: Joi.string().required(),
        rating: Joi.number().required().min(1).max(5),
    }).required(),
});

// Export in a way that matches how it's imported in app.js
module.exports = { listingSchema, reviewSchema };