const express = require("express");
const sensor = require("node-dht-sensor");
const os = require("os");
const networkInterfaces = os.networkInterfaces();

const app = express();
app.use(express.json());
const port = 6800;

const { initializeApp } = require("firebase-admin/app");
const admin = require("firebase-admin");
const config = require("./config.json");

initializeApp({
  credential: admin.credential.cert(config),
  databaseURL: config?.db_url,
});

const { getDatabase } = require("firebase-admin/database");
const db = getDatabase();

const server = require("http").Server(app);

const getSensorReading = () => {
  return sensor.read(11, 4, function (err, temperature, humidity) {
    if (!err) {
      console.log(`temp: ${temperature}°C, humidity: ${humidity}%`);
      return { temperature, humidity };
    }
  });
};

const setNewData = (temperature, humidity) => {
  const now = new Date();
  db.ref(`/${config?.room_id}/temperature`).push({
    x: now.toISOString(),
    y: temperature,
  });
  db.ref(`/${config?.room_id}/humidity`).push({
    x: now.toISOString(),
    y: humidity,
  });
};

const convertToF = (celsius) => {
  return celsius * (9 / 5) + 32;
};

const getNewWeatherData = () => {
  sensor.read(11, 4, function (err, temperature, humidity) {
    if (!err) {
      setNewData(convertToF(temperature), humidity);
    }
  })
};

const run = () => {
  setTimeout(() => {
    getNewWeatherData();
    run();
  }, 300000);
};

app.get("/*", async (req, res) => {
  const data = await getSensorReading();
  return res.send(data);
});

server.listen(port, () => {
  if (!config?.room_id) {
    return console.error(
      "Error! room_id is undefined in config.json.  Add a new key to the config.json named 'room_id', and restart the server."
    );
  }
  console.log(`Weather Agent DHT running on ${networkInterfaces}:${port}`);
  db.ref(`/rooms/${config?.room_id}`).push(config?.room_id);
  getNewWeatherData();

  return run();
});
