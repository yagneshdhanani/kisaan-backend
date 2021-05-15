const express = require("express");
const config = require("config");
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

// * Import routes
const listing = require("./routes/listings");
const users = require("./routes/users");
const weather = require("./routes/weather");

// * Initialize express app
const app = express();
const PORT = process.env.PORT || config.get("port");

// * Init Gfs
let gfs;

// * Connect to mongoDB
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection Error: "));
db.once("open", () => {
  gfs = Grid(db.db, mongoose.mongo);
  gfs.collection("uploads");
  console.log("connection successful");
});

// * Middlewares
app.use(express.json());

// * Create Storage Engine
const storage = new GridFsStorage({
  url: process.env.DB_URL,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads",
        };
        resolve(fileInfo);
      });
    });
  },
});
const upload = multer({ storage });

app.use("/api/listings", listing(upload));
app.use("/api/users", users(upload));
app.use("/api/weather", weather);

// * Display Image
app.get("/image/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check for file
    if (!file || file.length === 0) {
      return res.status(404).send({ err: "No file found!" });
    }
    if (err) return res.json({ err });

    // Check for image
    if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
      // Read output to browser
      const readStream = gfs.createReadStream(file.filename);
      readStream.pipe(res);
    } else {
      res.status(404).json({ err: "Image not found" });
    }
  });
});

// * Delete an image
app.delete("/image/:id", (req, res) => {
  gfs.remove({ _id: req.params.id, root: "uploads" }, (err, gridStore) => {
    if (err) {
      return res.json({ message: err, code: 404 });
    }
    res.json({ message: "Deleted successfuly", code: 200 });
  });
});

app.get("/", (req, res) => {
  res.send("Okay");
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
