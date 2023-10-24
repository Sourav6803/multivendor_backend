const express = require("express");
const router = express.Router();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

const stripe = require("stripe")("sk_test_51Nx8DvSA4C2MPiCxQctSbjCxpayAvfWMb14KQ6Fi4XPcaet6HQnFCsr4HVUvPDKOMuPcNdg6iAYAKfGPzPjMJ7G500IibwHa3a");


router.post(
  "/process",
  catchAsyncErrors(async (req, res, next) => {
    console.log("hii")
    const myPayment = await stripe.paymentIntents.create({
      amount: req?.body?.amount,
      currency: "inr",
      metadata: {
        company: "Jamalpur_Baazar",
      },
    });
    console.log(myPayment)
    res.status(200).json({
      success: true,
      client_secret: myPayment.client_secret,
    });
  })
);

router.get(
  "/stripeapikey",
  catchAsyncErrors(async (req, res, next) => {
    res.status(200).json({ stripeApikey: process.env.STRIPE_API_KEY });
  })
);


module.exports = router;