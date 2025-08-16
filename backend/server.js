// server.js
require("dotenv").config();
const express = require("express");
const axios = require("axios"); // use axios instead of fetch
const app = express();
const cors =require('cors');
app.use(cors());
app.use(express.json());
const BASE_WEATHER = "https://api.openweathermap.org/data/2.5/weather";
const BASE_FORECAST = "https://api.openweathermap.org/data/2.5/forecast";

function getUnitsParam() {
  return "metric"; // or decide dynamically
}

app.get("/api/weather", async (req, res) => {
  try {
    const { city, lat, lon } = req.query;
    let url;

    if (q) {
      url = `${BASE_WEATHER}?q=${encodeURIComponent(city)}&appid=${process.env.OPENWEATHER_API_KEY}&units=${getUnitsParam()}`;
    } else if (lat && lon) {
      url = `${BASE_WEATHER}?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=${getUnitsParam()}`;
    } else {
      return res.status(400).json({ error: "Missing query parameters" });
    }

    const r = await axios.get(url);
    res.json(r.data);
  } catch (err) {
    res.status(400).json({ error: "City not found" });
  }
});

app.get("/api/forecast", async (req, res) => {
  try {
    const { city, lat, lon } = req.query;
    let url;

    if (q) {
      url = `${BASE_FORECAST}?q=${encodeURIComponent(city)}&appid=${process.env.OPENWEATHER_API_KEY}&units=${getUnitsParam()}`;
    } else if (lat && lon) {
      url = `${BASE_FORECAST}?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=${getUnitsParam()}`;
    } else {
      return res.status(400).json({ error: "Missing query parameters" });
    }

    const r = await axios.get(url);
    res.json(r.data);
  } catch (err) {
    res.status(400).json({ error: "Forecast not available" });
  }
});



app.listen(3000, () => console.log("✅ Server running at http://localhost:3000"));
