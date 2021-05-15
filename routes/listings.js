const express = require("express");
const Listing = require("../models/Listings");

const router = express.Router();

module.exports = (upload) => {
  // // * Init Gfs
  // let gfs;

  // // * DB Connection
  // mongoose.connect(process.env.DB_URL, {
  //   useNewUrlParser: true,
  //   useUnifiedTopology: true,
  // });
  // const db = mongoose.connection;
  // db.on("error", console.error.bind(console, "Connection error:"));
  // db.once("open", () => {
  //   gfs = Grid(db.db, mongoose.mongo);
  //   gfs.collection("uploads");
  // });

  // * Get All Listing
  router.get("/all", async (req, res) => {
    try {
      const result = await Listing.find().populate("seller").exec();
      res.send(result);
    } catch (error) {
      console.log(error);
      res.send({ code: 400 });
    }
  });

  // * Get Listing By ID
  router.get("/find/:id", async (req, res) => {
    const id = req.params.id;

    try {
      const result = await Listing.findById(id).populate("seller").exec();
      console.log(result);
    } catch (error) {
      console.log(error);
    }
    res.send("ohk");
  });

  // * Get Users All Listings
  router.get("/user-listings/:id", async (req, res) => {
    const id = req.params.id;
    console.log("id", id);
    try {
      const result = await Listing.find({ seller: id });
      console.log(result);
      res.send({ result });
    } catch (error) {
      console.log(error);
      res.send({ message: "Got an error" });
    }
  });

  // * Get Listing from Category
  router.get("/category/:label", async (req, res) => {
    const label = req.params.label;
    try {
      const result = await Listing.find({ category: label })
        .populate("seller")
        .exec();
      res.send({ result });
    } catch (error) {
      console.log(error);
      res.send({ message: "Got an error" });
    }
  });

  // * Create a new Listing
  router.post("/new", upload.array("images", 3), async (req, res) => {
    const images = req.files.map(({ filename, originalname, id }) => ({
      filename,
      originalname,
      id,
    }));

    const listing = new Listing({
      title: req.body.title,
      price: parseFloat(req.body.price),
      category: req.body.category,
      description: req.body.description,
      seller: req.body.seller,
      images: images,
    });

    try {
      const result = await listing.save();
      console.log(result);
    } catch (error) {
      console.log(error);
    }
    res.send({ message: "Went well" });
  });

  // // * Display Image
  // router.get("/image/:filename", (req, res) => {
  //   gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
  //     // Check for file
  //     if (!file || file.length === 0) {
  //       return res.status(404).send({ err: "No file found!" });
  //     }
  //     if (err) return res.json({ err });

  //     // Check for image
  //     if (
  //       file.contentType === "image/jpeg" ||
  //       file.contentType === "image/png"
  //     ) {
  //       // Read output to browser
  //       const readStream = gfs.createReadStream(file.filename);
  //       readStream.pipe(res);
  //     } else {
  //       res.status(404).json({ err: "Image not found" });
  //     }
  //   });
  // });

  return router;
};
