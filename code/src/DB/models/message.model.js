import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      minLength: [
        2,
        `Message connot be less than 2 char but you have entered a {VALUE}`,
      ],
      maxLength: [
        25,
        `Message connot be more than 25 char but you have entered a {VALUE}`,
      ],
        
      required: function () {
        return !this.attachments?.length;
      },
    },
    attachments: {
      type: [String],
    },
    recieverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    collection: "messages",
    timestamps: true,
  },
);

export const messageModel =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
