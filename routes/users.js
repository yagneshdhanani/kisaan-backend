const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");

const User = require("../models/User");

const router = express.Router();
const { registerUser, loginUser } = require("../middleware/validate");

module.exports = (upload) => {
  // * Init Gfs
  let gfs;

  // * DB Connection
  mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "Connection error:"));
  db.once("open", () => {
    gfs = Grid(db.db, mongoose.mongo);
    gfs.collection("uploads");
  });

  // * Register a new User
  router.post("/register", async (req, res) => {
    // Validate user object data
    const { error } = registerUser(req.body);
    if (error) return res.send({ message: error.message, code: 400 });

    const { name, email, phone, city, password } = req.body;

    // Check for unique email and mobile
    const isEmailExist = await User.findOne({ email: email });
    if (isEmailExist)
      return res.send({ message: "Email is already registerd", code: 400 });

    const isMobileExist = await User.findOne({ phone: phone });
    if (isMobileExist)
      return res.send({ message: "Phone is already registerd", code: 400 });

    // Hashing password
    const salt = await bcrypt.genSalt(8);
    const hashPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name: name,
      email: email,
      phone: phone,
      city: city,
      password: hashPassword,
    });

    try {
      const newUser = await user.save();
      console.log("Registered user: ", newUser);
      res.send({ newUser });
    } catch (error) {
      console.log("Register error: ", error);
      res.status(400).send({ message: error });
    }
  });

  // * Login an existing user
  router.post("/login", async (req, res) => {
    // Validate user object
    const { error } = loginUser(req.body);
    if (error) return res.send({ message: error.message, code: 400 });

    // Get user Email
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.send({ message: "Email not found!", code: 400 });

    // Compare password
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.send({ message: "Invalid Password!", code: 400 });

    const { isFarmer, _id, name, phone } = user;

    try {
      const jsonToken = jwt.sign(
        { isFarmer, _id, name, phone },
        process.env.TOKEN_SECRET
      );
      return res.send(jsonToken);
    } catch (error) {
      console.log("error: ", error.message);
      return res.send({ message: "Error generating code", code: 400 });
    }
  });

  // * Make an user Farmer
  router.get("/make-farmer/:id", async (req, res) => {
    const id = req.params.id;
    let user = await User.findById(id);
    user.isFarmer = !user.isFarmer;
    await user.save();

    const { isFarmer, _id, name, phone } = user;

    try {
      const jsonToken = jwt.sign(
        { isFarmer, _id, name, phone },
        process.env.TOKEN_SECRET
      );
      return res.send(jsonToken);
    } catch (error) {
      console.log("error: ", error.message);
      return res.send({ message: "Error generating code", code: 400 });
    }
  });

  // * Upload profile image
  router.post(
    "/profile-image/:id",
    upload.single("image"),
    async (req, res) => {
      const user = await User.findById(req.params.id);
      if (!user) return res.send({ message: "User not found", code: 400 });

      user.image = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        id: req.file.id,
      };

      await user.save();
      const { _id, name, city, email, phone, image } = user;
      res.send({ _id, name, city, email, phone, image });
    }
  );

  // * Update user Data
  router.put("/update/:id", async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.send({ message: "User not found", code: 400 });

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.email = req.body.email || user.email;
    user.city = req.body.city || user.city;

    await user.save();
    res.send({ user });
  });

  // * Get User data
  router.get("/user/:id", async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.send({ message: "User not found", code: 400 });

    const { name, email, phone, city, image, _id } = user;
    res.send({ name, email, phone, city, image, _id });
  });

  return router;
};
