const { Schema, model } = require("mongoose");

const yvidSchema = new Schema(
  {
    id: String,
    title: String,
    description: String,
    publishedAt: Date,
    thumbnails: {
      default: String,
      medium: String,
      high: String,
    },
  },
  { timestamps: true }
);

const YvidModel = model("Yvid", yvidSchema);

module.exports = YvidModel;
