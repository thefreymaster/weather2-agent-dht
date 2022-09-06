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

app.get("/status", async (request, response) => {
  const data = await getSensorReading();
  response.send(data);
});

server.listen(port, () => {
  if (!config?.room_id) {
    return console.error(
      "Error! room_id is undefined in config.json.  Add a new key to the config.json named 'room_id', and restart the server."
    );
  }
  console.log(`Weather Agent DHT running on ${networkInterfaces}:${port}`);
  // db.ref(`/rooms/${config?.room_id}`).push(config?.room_id);
  // getNewWeatherData();

  // return run();
});
