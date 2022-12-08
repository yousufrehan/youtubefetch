const { google } = require("googleapis");
const Yvid = require("./models/model");

// Variable to keep the index of the current API key
let apiKeyIndex = 0;

// Fetching youtube videos and saving them to the database
function fetchAndSave() {
  google
    .youtube("v3")
    .search.list({
      key: process.env.GOOGLE_API_KEYS.split(",")[apiKeyIndex],
      part: ["snippet,id"],
      maxResults: 10,
      order: "date",
      publishedAfter: "2020-01-01T00:00:00Z",
      q: "laptop reviews",
      relevanceLanguage: "en-us",
      type: ["video"],
    })
    .then((res) => saveData(res.data.items))
    .catch((err) => {
      if (isQuotaExceeded(err)) {
        if (process.env.GOOGLE_API_KEYS.split(",").length > apiKeyIndex) {
          console.log("Ran Out of APIKeys");
        } else {
          console.log("Trying with the next API key...");
          apiKeyIndex++;
        }
      }
      console.log(err);
    });
}

// Function for checking whether the Quota is Exceeded or not
// If the quota is exceeded, then it returns true else false
let isQuotaExceeded = (err) => {
  if (err.code === 403) {
    let errorList = err.error.errors;
    return errorList.has((e) => e.reason === "quotaExceeded");
  } else {
    return false;
  }
};

// Mapping the fetched youtube videos to a promise array
// which can be used to determine if all the videos were saved
// to the database or not.
function saveData(items) {
  let promises = items.map(function (vid) {
    const {
      id: { videoId },
      snippet: { publishedAt, title, description, thumbnails },
    } = vid;

    const newYvid = new Yvid({
      id: videoId,
      title,
      description,
      publishedAt: Date.parse(publishedAt),
      thumbnails: {
        default: thumbnails.default.url,
        medium: thumbnails.medium.url,
        high: thumbnails.high.url,
      },
    });

    return newYvid.save();
  });

  Promise.all(promises).then(
    console.log("Added fetched results to the database")
  );
}

// Function to get the paginated results from the database
function getPaginatedYvids(limit, skipIndex) {
  return Yvid.find()
    .sort({ publishedAt: -1 })
    .limit(limit)
    .skip(skipIndex)
    .exec();
}

// Function to get the videos containing particular title
// and description from the database
async function getYVideos(title = "", description = "") {
  return await Yvid.find({
    title: { $regex: title, $options: "$i" },
    description: { $regex: description, $options: "$i" },
  }).exec();
}

module.exports = { fetchAndSave, getPaginatedYvids, getYVideos };
