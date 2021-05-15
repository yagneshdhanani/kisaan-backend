const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/", async (req, res) => {
  const { lat, long } = req.query;

  console.log(lat, long);

  if (!lat || !long)
    return res.send({ message: "Bot parameters are necessary", code: 400 });

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${long}&exclude=minutely,hourly,daily&appid=${process.env.WEATHER_API}`
    );
    console.log(response.data);
    res.send(response.data);
  } catch (error) {
    console.log(error);
    res.send({ message: "Couldn't get info", code: 400 });
  }
});

module.exports = router;
