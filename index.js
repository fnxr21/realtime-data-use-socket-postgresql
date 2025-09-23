const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");
const dbConfig = require("./config/db.config");
require("dotenv").config();

const app = express();
const PORT = 4000;

const corsOptions = { origin: "*" };
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Postgres pool
const pool = new Pool({
  user: dbConfig.USER,
  host: dbConfig.HOST,
  database: dbConfig.DB,
  password: dbConfig.PASSWORD,
  port: dbConfig.PORT,
});

// Wrap express in raw http server
const serverSocket = createServer(app);

const io = new Server(serverSocket, {
  cors: corsOptions,
});

// Serve initial data
app.get("/data", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM realtime_data ORDER BY created_at ASC LIMIT 50"
  );
  res.json(result.rows);
});

// // Listen for new inserts
// (async () => {
//   const client = await pool.connect();
//   await client.query("LISTEN new_data");

//   client.on("notification", async (msg) => {
//     const payload = JSON.parse(msg.payload);
//     io.emit("new_data", payload);
//   });
// })();

(async () => {
  const client = await pool.connect();
  await client.query("LISTEN new_data");

  client.on("notification", (msg) => {
    io.emit("new_data", JSON.parse(msg.payload));
  });
})();

// Insert test data every 2second
setInterval(async () => {
  const value = Math.floor(Math.random() * 100);
  const result = await pool.query(
    "INSERT INTO pegasus.realtime_data (value) VALUES ($1) RETURNING *",
    [value]
  );
  const row = result.rows[0];
  await pool.query(`NOTIFY new_data, '${JSON.stringify(row)}'`);
}, 2000);

// Start server
serverSocket.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// -- Trigger function
// CREATE OR REPLACE FUNCTION notify_new_data() RETURNS trigger AS $$
// BEGIN
//   PERFORM pg_notify('new_data', row_to_json(NEW)::text);
//   RETURN NEW;
// END;
// $$ LANGUAGE plpgsql;

// -- Attach trigger
// CREATE TRIGGER data_insert_trigger
// AFTER INSERT ON realtime_data
// FOR EACH ROW EXECUTE FUNCTION notify_new_data();
