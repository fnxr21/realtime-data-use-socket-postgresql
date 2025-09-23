module.exports = {
  HOST: "",//ip
  USER: "", //username
  PASSWORD: "", //pw
  DB: "", //db name
  SCHEMA: "",//schema
  PORT: 3000, //port
  dialect: "postgres",
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
