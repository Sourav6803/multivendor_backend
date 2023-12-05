const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const Product = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
// const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");
const { upload } = require("../multer")
const fs = require("fs")
const file = require('../controller/aws')


router.post("/upload", catchAsyncErrors(async (req, res, next) => {
  let files = req.files

  let photos = []
  let uploadImage

  for (let i = 0; i < files.length; i++) {
    uploadImage = await file.uploadFile(files[i])
    photos.push(uploadImage)
  }
  res.send({msg: "Succes", url: photos})
}
))

// create product
router.post("/create-product", catchAsyncErrors(async (req, res, next) => {
  try {
    const shopId = req.body.shopId;
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return next(new ErrorHandler("Shop Id is invalid!", 400));
    } else {
      let files = req.files

      let photos = []
      let uploadImage

      for (let i = 0; i < files.length; i++) {
        uploadImage = await file.uploadFile(files[i])
        photos.push(uploadImage)
      }

      req.body.images = photos

      const productData = req.body;
      productData.images = photos;
      productData.shop = shop;

      const discPercentage = Math.ceil(((req.body.originalPrice - req.body.discountPrice) / req.body.originalPrice) * 100)
      req.body.discountPercentage = discPercentage


      const product = await Product.create(productData);

      res.status(201).json({ success: true, product });
    }
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
})
);

// get all products of a shop
router.get("/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({ shopId: req.params.id });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// delete product of a shop
router.delete("/delete-shop-product/:id", isSeller, catchAsyncErrors(async (req, res, next) => {
  try {

    const productId = req.params.id
    const productData = await Product.findById(productId)

    productData.images.forEach((imageUrl) => {
      const filename = imageUrl;
      const filePath = `uploads/${filename}`
      fs.unlink(filePath, err => {
        if (err) {
          console.log(err)
        }
      })
    })

    const product = await Product.findByIdAndDelete(productId)

    if (!product) {
      return next(new ErrorHandler("Product is not found with this id", 404));
    }

    res.status(200).json({ success: true, product })




    // const product = await Product.findById(req.params.id);


    // if (!product) {
    //   return next(new ErrorHandler("Product is not found with this id", 404));
    // }    

    // for (let i = 0; 1 < product.images.length; i++) {
    //   const result = await cloudinary.v2.uploader.destroy(
    //     product.images[i].public_id
    //   );
    // }

    // await product.remove();

    // res.status(201).json({
    //   success: true,
    //   message: "Product Deleted successfully!",
    // });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
})
);

router.get("/getProductBySubCAtegory", catchAsyncErrors(async (req, res, next) => {
  try {
    const data = req.query


    if (Object.keys(data).length == 0) {
      const allProducts = await Product.find({})
      if (allProducts.length == 0) {
        return res.status(404).send({ status: false, message: "No products found" })
      }
      return res.status(200).send({ status: true, message: "products fetched successfully", data: allProducts })

    } else {
      let subCategory = req.query.subCategory
      let tags = req.query.tags
      let priceGreaterThan = req.query.priceGreaterThan
      let priceLessThan = req.query.priceLessThan


      let filter = {}

      if (subCategory != null) {
        //if (!/^[a-zA-Z0-9]{1,30}$/.test(name)) return res.status(400).send({ status: false, message: "name should contain only alphabets" })
        filter.subCategory = { $regex: subCategory, $options: "i" }

      }

      if (tags != null) {
        //if (!/^[a-zA-Z0-9]{1,30}$/.test(name)) return res.status(400).send({ status: false, message: "name should contain only alphabets" })
        filter.tags = { $regex: tags, $options: "i" }

      }

      if (priceGreaterThan != null) {
        if (!/^[+]?([0-9]+\.?[0-9]*|\.[0-9]+)$/.test(priceGreaterThan)) return res.status(400).send({ status: false, message: "price filter should be a vaid number" })
        filter.price = { $gt: `${priceGreaterThan}` }
      }

      if (priceLessThan != null) {
        if (!/^[+]?([0-9]+\.?[0-9]*|\.[0-9]+)$/.test(priceLessThan)) {
          return res.status(400).send({ status: false, message: "price filter should be a vaid number" })
        }
        filter.price = { $lt: `${priceLessThan}` }
      }


      //sorting
      if (req.query.priceSort != null) {
        if ((req.query.priceSort != 1 && req.query.priceSort != -1)) {
          return res.status(400).send({ status: false, message: 'use 1 for low to high and use -1 for high to low' })
        }
      }

      if (!priceGreaterThan && !priceLessThan) {
        const productList = await Product.find(filter).sort({ price: req.query.priceSort })
        if (productList.length == 0) {
          return res.status(404).send({ status: false, message: "No products available" })
        }
        return res.status(200).send({ status: true, message: "Products list", data: productList })
      }

      if (priceGreaterThan && priceLessThan) {
        const productList = await Product.find({
          $and: [filter, { price: { $gt: priceGreaterThan } }, {
            price: { $lt: priceLessThan }
          }]
        }).sort({ price: req.query.priceSort })
        if (productList.length == 0) {
          return res.status(404).send({ status: false, message: "No available products" })
        }
        return res.status(200).send({ status: true, message: "Products list", data: productList })
      }

      if (priceGreaterThan || priceLessThan) {
        const productList = await Product.find(filter).sort({ price: req.query.priceSort })
        if (productList.length == 0) {
          return res.status(404).send({ status: false, message: "No available products" })
        }
        return res.status(200).send({ status: true, message: "Products list", data: productList })
      }
    }
  }
  catch (err) {
    return next(new ErrorHandler(err, 400));
  }
}))

// get all products
router.get("/get-all-products", catchAsyncErrors(async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(201).json({
      success: true,
      products,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
})
);

// review for a product
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { user, rating, comment, productId, orderId } = req.body;

      const product = await Product.findById(productId);

      const review = {
        user,
        rating,
        comment,
        productId,
      };

      const isReviewed = product.reviews.find(
        (rev) => rev.user._id === req.user._id
      );

      if (isReviewed) {
        product.reviews.forEach((rev) => {
          if (rev.user._id === req.user._id) {
            (rev.rating = rating), (rev.comment = comment), (rev.user = user);
          }
        });
      } else {
        product.reviews.push(review);
      }

      let avg = 0;

      product.reviews.forEach((rev) => {
        avg += rev.rating;
      });

      product.ratings = avg / product.reviews.length;

      await product.save({ validateBeforeSave: false });

      await Order.findByIdAndUpdate(
        orderId,
        { $set: { "cart.$[elem].isReviewed": true } },
        { arrayFilters: [{ "elem._id": productId }], new: true }
      );

      res.status(200).json({
        success: true,
        message: "Reviwed succesfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// all products --- for admin
router.get("/admin-all-products", isAuthenticated, isAdmin("Admin"), catchAsyncErrors(async (req, res, next) => {
  try {
    const products = await Product.find().sort({
      createdAt: -1,
    });
    res.status(201).json({
      success: true,
      products,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
})
);

module.exports = router