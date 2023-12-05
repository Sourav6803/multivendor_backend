const Messages = require("../model/messages");
const Conversation = require("../model/conversation")
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const express = require("express");
const router = express.Router();
const file = require('../controller/aws')


router.post("/uploadFile", catchAsyncErrors(async (req, res, next) => {
  try {

    let uploadFile;
    if (req?.files) {
      const files = req.files
      const myFile = files[0]
      if(myFile.mimetype === 'image/png' || myFile.mimetype === 'image/jpeg' || myFile.mimetype === 'image/jpg' || myFile.mimetype === 'image/gif' || myFile.mimetype === 'image/bmp' || myFile.mimetype === 'image/svg'){
        uploadFile = await file.uploadFile(myFile)
        return res.send(uploadFile)
      }else{
        return res.status(200).send({message: "Only JPEG, PNG, SVG, JPG and GIF images are allowed!"})
      }
      
    }
    
  } catch (error) {
    return next(new ErrorHandler(error.message), 500);
  }

}))


// create new message
router.post("/create-new-message", catchAsyncErrors(async (req, res, next) => {
  try {
    const newMessage = new Messages(req.body);
    await newMessage.save();
    await Conversation.findByIdAndUpdate(req.body.conversationId, { lastMessage: req.body.text }, { new: true });
    res.status(200).json({ newMessage, msg: "Message has been sent successfully" });

  } catch (error) {
    return next(new ErrorHandler(error.message), 500);
  }
})
);

// get all messages with conversation id
router.get("/get-all-messages/:id", catchAsyncErrors(async (req, res, next) => {
    try {
      const messages = await Messages.find({
        conversationId: req.params.id,
      });

      res.status(201).json({
        success: true,
        messages,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message), 500);
    }
  })
);

module.exports = router;