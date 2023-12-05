const mongoose = require("mongoose");

const messagesSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
    },
    text: {
      type: String,
    },
    sender: {
      type: String,
    },
    type: {
      type: String,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Messages", messagesSchema);
