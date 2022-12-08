const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const {
  fetchAndSave,
  getPaginatedYvids,
  getYVideos,
} = require("./fetch");

mongoose.set("strictQuery", false);
const app = express();

app.use(express.json());

//mongo connnect

mongoose.connect(process.env.ATLAS_URL);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Successfully connected to MongoDB via Mongoose");
});

// fetch and save the latest videos from the Youtube API in every 10 second
setInterval(() => {
  fetchAndSave();
}, 10000);

// start

// sorted in descending order of published datetime
app.get("/", paginatedResults(), (req, res) => {
  res.json(res.paginatedResults);
});

// Function to carry out pagination by evaluating limit and skipIndex

function paginatedResults() {
  return async (req, res, next) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skipIndex = (page - 1) * limit;
    const results = {};

    try {
      results.results = await getPaginatedYvids(limit, skipIndex);
      res.paginatedResults = results;
      next();
    } catch (e) {
      res.status(500).json({ message: "Error Occured" });
    }
  };
}

// Basic search API to search the stored videos using their title and description
app.post("/search", (req, res) => {
  try {
    getYVideos(req.body.title, req.body.description).then((arr) => {
      res.json(arr);
    });
  } catch (e) {
    res.status(500).json({ message: e });
  }
});

//  end

app.listen(3000, function () {
  console.log("Server running on port 3000");
});
