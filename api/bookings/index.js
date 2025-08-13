const pool = require("../../db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM bookings ORDER BY id ASC"
      );
      res.status(200).json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      client.release();
    }
  } else if (req.method === "POST") {
    const client = await pool.connect();
    try {
      const { title, description, date, time, phone_number, email, user_id } =
        req.body;
      const result = await client.query(
        "INSERT INTO bookings (title, description, date, time, phone_number, email, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [title, description, date, time, phone_number, email, user_id]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Booking posting failed" });
    } finally {
      client.release();
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
