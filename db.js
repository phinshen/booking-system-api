const { Pool } = require("pg");
const { DATABASE_URL } = process.env;

console.log("Connecting to DATABASE_URL:", DATABASE_URL);

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;
