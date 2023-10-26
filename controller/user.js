const express = require('express')
const path = require("path")
const User = require("../model/user")
const router = express.Router()
const { upload } = require("../multer")
const ErrorHandler = require('../utils/ErrorHandler')
const fs = require('fs')
const jwt = require("jsonwebtoken")

const sendMail = require('../utils/sendMail')
const catchAsyncError = require("../middleware/catchAsyncErrors")
const sendToken = require("../utils/jwtToken")
const catchAsyncErrors = require('../middleware/catchAsyncErrors')
const { isAuthenticated , isAdmin, isSeller} = require('../middleware/auth')

// Create user
router.post("/create-user", upload.single("file"), async (req, res, next) => {
    const { name, email, password, avtar } = req.body
    const userEmail = await User.findOne({ email })


    if (userEmail) {
        // const fileName = req.file.filename
        // const filePath = `uploads/${fileName}`
        // fs.unlink(filePath, (err)=>{
        //     if(err){
        //         console.log(err)
        //         res.status(500).json({message: "Error deleting file"})
        //     }
        // })
        return next(new ErrorHandler("User already exist", 400))
        //return res.status(500).send({status: false, message: "User already exist"})
    }

    const fileName = req.file.filename
    const fileUrl = path.join(fileName)

    const avatar = fileUrl

    const user = {
        name: name,
        email: email,
        password: password,
        avatar: avatar
    }

    const activationToken = createActivationToken(user)
    const activationUrl = `https://multivendor-frontend-irhh.vercel.app/activation/${activationToken}`

    try {
        await sendMail({
            email: user.email,
            subject: "Activation Your Account",
            message: `Hello ${user.name}, please click on the link to activate your account: ${activationUrl}`
        })
        //res.status(201).json({success: true, message: `please check your email:- ${user.email} to activate your account`})
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 400))
        // return res.status(500).send({status: false, message: err.message})
    }

    // const newUser = await User.create(user)
    res.status(201).send({ success: true, message: `Please check your email:- ${user.email} to activate your account` })
})

// create activation token 
const createActivationToken = (user) => {
    return jwt.sign(user, process.env.ACTIVATION_SECRET, {
        expiresIn: "1d"
    })
}

// activate user  
router.post("/activation", catchAsyncError(async (req, res, next) => {
    try {
        const { activation_token } = req.body
        const newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET)


        if (!newUser) {
            return next(new ErrorHandler("Invalid Token", 400))
        }
        const { name, email, password, avatar } = newUser

        let user = await User.findOne({ email })
        // if (user) {
        //     return next(new ErrorHandler("User already exist."))
        //     //return res.status(400).send({status: false, message: "User already exist"})
        // }

        user = await User.create({
            name, email, password, avatar
        })

        sendToken(user, 201, res)
    }
    catch (error) {
        return next(new ErrorHandler(error.message, 500))
        //return res.status(500).send({status: false, message: err.message})
    }
}))

// login user
router.post(
    "/login-user",
    catchAsyncErrors(async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return next(new ErrorHandler("Please provide the all fields!", 400));
            }

            const user = await User.findOne({ email }).select("+password");

            if (!user) {
                return next(new ErrorHandler("User doesn't exists!", 400));
            }

            const isPasswordValid = await user.comparePassword(password);

            if (!isPasswordValid) {
                return next(
                    new ErrorHandler("Please provide the correct information", 400)
                );
            }

            sendToken(user, 201, res);
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);


router.get("/getuser", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return next(new ErrorHandler("User doesn't exists", 400));
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
})
);


router.get("/logout",
    catchAsyncErrors(async (req, res, next) => {
        try {
            res.cookie("token", null, {
                expires: new Date(Date.now()),
                httpOnly: true,
                sameSite: "none",
                secure: true,
            });
            res.status(201).json({
                success: true,
                message: "Log out successful!",
            });
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);

// update user info
router.put(
    "/update-user-info",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
      try {
        const { email, password, phoneNumber, name } = req.body;
  
        const user = await User.findOne({ email }).select("+password");
  
        if (!user) {
          return next(new ErrorHandler("User not found", 400));
        }
  
        const isPasswordValid = await user.comparePassword(password);
  
        if (!isPasswordValid) {
          return next(
            new ErrorHandler("Please provide the correct information", 400)
          );
        }
  
        user.name = name;
        user.email = email;
        user.phoneNumber = phoneNumber;
  
        await user.save();
  
        res.status(201).json({
          success: true,
          user,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    })
  );
  
  // update user avatar
  router.put(
    "/update-avatar",
    isAuthenticated,upload.single("image"),
    catchAsyncErrors(async (req, res, next) => {
      try {
        let existsUser = await User.findById(req.user.id);
        // if (req.body.avatar !== "") {
        //   const imageId = existsUser.avatar.public_id;
  
        //   await cloudinary.v2.uploader.destroy(imageId);
  
        //   const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        //     folder: "avatars",
        //     width: 150,
        //   });
  
        //   existsUser.avatar = {
        //     public_id: myCloud.public_id,
        //     url: myCloud.secure_url,
        //   };
        // }

        const existAvatarPath = `uploads/${existsUser.avatar}`
        fs.unlinkSync(existAvatarPath)
        const fileUrl = path.join(req.file.filename)
  
        const user = await User.findByIdAndUpdate(req.user.id, {avatar: fileUrl}, {new:true})
  
        res.status(200).json({
          success: true,
          user
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    })
  );
  
  // update user addresses
  router.put(
    "/update-user-addresses",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
      try {
        const user = await User.findById(req.user.id);
  
        const sameTypeAddress = user.addresses.find(
          (address) => address.addressType === req.body.addressType
        );
        if (sameTypeAddress) {
          return next(
            new ErrorHandler(`${req.body.addressType} address already exists`)
          );
        }
  
        const existsAddress = user.addresses.find(
          (address) => address._id === req.body._id
        );
  
        if (existsAddress) {
          Object.assign(existsAddress, req.body);
        } else {
          // add the new address to the array
          user.addresses.push(req.body);
        }
  
        await user.save();
  
        res.status(200).json({
          success: true,
          user,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    })
  );
  
  // delete user address
  router.delete(
    "/delete-user-address/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
      try {
        const userId = req.user._id;
        const addressId = req.params.id;
  
        await User.updateOne(
          {
            _id: userId,
          },
          { $pull: { addresses: { _id: addressId } } }
        );
  
        const user = await User.findById(userId);
  
        res.status(200).json({ success: true, user });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    })
  );
  
  // update user password
  router.put(
    "/update-user-password",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
      try {
        const user = await User.findById(req.user.id).select("+password");
  
        const isPasswordMatched = await user.comparePassword(
          req.body.oldPassword
        );
  
        if (!isPasswordMatched) {
          return next(new ErrorHandler("Old password is incorrect!", 400));
        }
  
        if (req.body.newPassword !== req.body.confirmPassword) {
          return next(
            new ErrorHandler("Password doesn't matched with each other!", 400)
          );
        }
        user.password = req.body.newPassword;
  
        await user.save();
  
        res.status(200).json({
          success: true,
          message: "Password updated successfully!",
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    })
  );
  
  // find user infoormation with the userId
  router.get(
    "/user-info/:id",
    catchAsyncErrors(async (req, res, next) => {
      try {
        const user = await User.findById(req.params.id);
  
        res.status(201).json({
          success: true,
          user,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    })
  );
  
  // all users --- for admin
  router.get(
    "/admin-all-users",
    isAuthenticated,
    isAdmin("Admin"),
    catchAsyncErrors(async (req, res, next) => {
      try {
        const users = await User.find().sort({
          createdAt: -1,
        });
        res.status(201).json({
          success: true,
          users,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    })
  );
  
  // delete users --- admin
  router.delete(
    "/delete-user/:id",
    isAuthenticated,
    isAdmin("Admin"),
    catchAsyncErrors(async (req, res, next) => {
      try {
        const user = await User.findById(req.params.id);
  
        if (!user) {
          return next(
            new ErrorHandler("User is not available with this id", 400)
          );
        }
  
        const imageId = user.avatar.public_id;
  
        await cloudinary.v2.uploader.destroy(imageId);
  
        await User.findByIdAndDelete(req.params.id);
  
        res.status(201).json({
          success: true,
          message: "User deleted successfully!",
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    })
  );

module.exports = router