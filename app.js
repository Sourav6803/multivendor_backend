const express = require('express');
const ErrorHandler = require('./middleware/error');
const app = express()
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')
const cors = require("cors")
const path = require('path')
const multer = require("multer")
// const fileUpload = require("express-fileupload")

app.use(express.json())
app.use(cookieParser())
app.use( multer().any())

// const corsOptions ={
//     origin:'https://multivendor-frontend.vercel.app/', 
//     credentials:true,            //access-control-allow-credentials:true
//     optionSuccessStatus:200
// }
// app.use(cors(corsOptions));

app.use(cors({
    origin: ['https://multivendor-frontend.vercel.app','https://jamalpurbazaarsourav.netlify.app/'],
    credentials: true
}))

// ['https://multivendor-frontend.vercel.app']
// https://multivendor-frontend-irhh.vercel.app/
app.use("/", express.static("uploads"))
app.use(bodyParser.urlencoded({extended: true, limit: "50mb"}))
app.use("/test", (req, res) => {
    res.send("Hello world!");
  });


// config
if(process.env.NODE_ENV !== "PRODUCTION"){
    require("dotenv").config({
        path: "backend/config/.env"
    })
}

// import routes
const user = require("./controller/user");
const shop = require('./controller/shop');
const product = require('./controller/product');
const event = require('./controller/event');
const cupon = require('./controller/couponCode');
const payment = require('./controller/payment');
const order = require('./controller/order');
const conversation = require('./controller/conversation');
const message = require('./controller/message');

app.use("/api/v2/user", user)
app.use("/api/v2/shop", shop)
app.use("/api/v2/product", product)
app.use("/api/v2/event", event)
app.use("/api/v2/cupon", cupon)
app.use("/api/v2/payment", payment);
app.use("/api/v2/order", order);
app.use("/api/v2/conversation", conversation);
app.use("/api/v2/message", message);


// It's for error handeling
app.use( ErrorHandler)

module.exports = app



