import mongoose from "mongoose";

const urlSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      require: true,
    },
    longUrl: {
      type: String,
      require: true,
    },
    shortUrl: {
      type: String,
      require: true,
    },
    click: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Url = mongoose.model("Url", urlSchema);
