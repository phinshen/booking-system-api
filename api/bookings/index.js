const pool = require("../../db");
const cors = require("../_cors");

module.exports = async (req, res) => {
  if (cors(req, res)) return;

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
