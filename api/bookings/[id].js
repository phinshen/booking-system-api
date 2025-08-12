const pool = require("../../db");

module.exports = async (req, res) => {
  const { id } = req.query;
  const client = await pool.connect();

  try {
    if (req.method === "PUT") {
      const { title, description, date, time, phone_number, email, user_id } =
        req.body;
      const result = await client.query(
        "UPDATE bookings SET title = $1, description = $2, date = $3, time = $4, phone_number = $5, email = $6, user_id = $7 WHERE id = $8 RETURNING *",
        [title, description, date, time, phone_number, email, user_id, id]
      );
      res
        .status(200)
        .json({ message: "Booking updated!", update: result.rows[0] });
    } else if (req.method === "DELETE") {
      const result = await client.query(
        "DELETE FROM bookings WHERE id = $1 RETURNING *",
        [id]
      );
      res
        .status(200)
        .json({ message: "Booking deleted!", deleted: result.rows[0] });
    } else {
      res.setHeader("Allow", ["PUT", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Operation failed" });
  } finally {
    client.release();
  }
};
