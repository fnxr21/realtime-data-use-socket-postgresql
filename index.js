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

// get api for first initial value
app.get("/data", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM pegasus.realtime_data ORDER BY created_at ASC LIMIT 10"
  );
  console.log("first initial");

  res.json(result.rows);
});

(async () => {
  let client;

  async function connect() {
    client = await pool.connect();
    await client.query("LISTEN new_data");
    console.log("Listening to new_data...");

    let count = 0;

    client.on("notification", (msg) => {
      const data = JSON.parse(msg.payload);
      count++;
      const enrichedData = { ...data, count };
      // console.log(enrichedData);
      console.log(msg.payload);
      io.emit("new_data", enrichedData);
    });

    client.on("error", async (err) => {
      console.error("Postgres client error:", err);
      client.release();
      setTimeout(connect, 1000);
    });

    client.on("end", () => {
      console.warn("Postgres client ended, reconnecting...");
      setTimeout(connect, 1000);
    });
  }

  await connect();
})();

// simple
// (async () => {
//   const client = await pool.connect();
//   await client.query("LISTEN new_data");
//   let count = 0;
//   client.on("notification", (msg) => {
//     // console.log(msg.payload);
//     const data = JSON.parse(msg.payload);
//     count++;
//     // attach count into the object
//     const enrichedData = {
//       ...data,
//       count,
//     };
//     console.log(enrichedData);
//     io.emit("new_data", JSON.parse(msg.payload));
//   });
// })();

// Start server
serverSocket.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

//

// postgresql

// CREATE TABLE realtime_data (
//     id SERIAL PRIMARY KEY,
//     value NUMERIC NOT NULL,
//     created_at TIMESTAMP DEFAULT NOW()
// );

// INSERT INTO realtime_data (value) VALUES (10), (20), (15);

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

// Insert data every 2second
// setInterval(async () => {
//   const value = Math.floor(Math.random() * 100);
//   const result = await pool.query(
//     "INSERT INTO pegasus.realtime_data (value) VALUES ($1) RETURNING *",
//     [value]
//   );
//   const row = result.rows[0];
//   await pool.query(`NOTIFY new_data, '${JSON.stringify(row)}'`);
// }, 2000);

//bulk insert in 2second base count as example 400
setInterval(async () => {
  const count = 400; // or 400 count insert
  const values = Array.from({ length: count }, () =>
    Math.floor(Math.random() * 100)
  );

  // Build parameter placeholders ($1), ($2), ...
  const placeholders = values.map((_, i) => `($${i + 1})`).join(", ");

  const result = await pool.query(
    `INSERT INTO pegasus.realtime_data (value) VALUES ${placeholders} RETURNING *`,
    values
  );

  // const rows = result.rows;
  // await pool.query(`NOTIFY new_data, '${JSON.stringify(rows)}'`);
}, 2000);
