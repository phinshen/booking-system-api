const { Pool } = require("pg");

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

// CORS middleware
function applyCors(req, res) {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://tpx-hairstudio-bookingsystem.vercel.app/",
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }

  return false;
}

// Main API handler
module.exports = async (req, res) => {
  // Apply CORS
  if (applyCors(req, res)) return;

  try {
    // Parse the URL to determine the endpoint
    const { url, method } = req;
    const urlParts = url
      .split("?")[0]
      .split("/")
      .filter((part) => part && part !== "api");

    console.log("Request:", { method, url, urlParts });

    // Route: / (root endpoint)
    if (urlParts.length === 0) {
      if (method === "GET") {
        return res.status(200).json({
          message: "Booking System API is running!",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
          endpoints: {
            "GET /api/": "API information",
            "GET /api/bookings": "Get all bookings",
            "POST /api/bookings": "Create a new booking",
            "GET /api/bookings/:id": "Get a booking by ID",
            "PUT /api/bookings/:id": "Update a booking by ID",
            "DELETE /api/bookings/:id": "Delete a booking by ID",
          },
        });
      }
    }

    // Route: /bookings
    if (urlParts[0] === "bookings") {
      // No ID provided - handle collection operations
      if (urlParts.length === 1) {
        if (method === "GET") {
          // GET /bookings - Get all bookings
          const client = await pool.connect();
          try {
            const result = await client.query(
              "SELECT * FROM bookings ORDER BY date DESC, time DESC"
            );
            return res.status(200).json(result.rows);
          } catch (err) {
            console.error("Database error:", err);
            return res.status(500).json({
              error: "Failed to fetch bookings",
              details: err.message,
            });
          } finally {
            client.release();
          }
        } else if (method === "POST") {
          // POST /bookings - Create new booking
          const client = await pool.connect();
          try {
            const {
              title,
              description,
              date,
              time,
              phone_number,
              email,
              user_id,
            } = req.body;

            // Validate required fields
            if (!title || !description || !date || !time || !phone_number) {
              return res.status(400).json({
                error: "Missing required fields",
                required: [
                  "title",
                  "description",
                  "date",
                  "time",
                  "phone_number",
                ],
                received: req.body,
              });
            }

            const result = await client.query(
              "INSERT INTO bookings (title, description, date, time, phone_number, email, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
              [
                title,
                description,
                date,
                time,
                phone_number,
                email || "example@gmail.com",
                user_id || "1",
              ]
            );

            return res.status(201).json(result.rows[0]);
          } catch (err) {
            console.error("Database error:", err);
            return res.status(500).json({
              error: "Failed to create booking",
              details: err.message,
            });
          } finally {
            client.release();
          }
        } else {
          res.setHeader("Allow", ["GET", "POST"]);
          return res
            .status(405)
            .json({ error: `Method ${method} Not Allowed on /bookings` });
        }
      }

      // ID provided - handle individual booking operations
      else if (urlParts.length === 2) {
        const bookingId = urlParts[1];

        // Validate ID is a number
        if (isNaN(bookingId)) {
          return res
            .status(400)
            .json({ error: "Invalid booking ID - must be a number" });
        }

        if (method === "GET") {
          // GET /bookings/:id - Get single booking
          const client = await pool.connect();
          try {
            const result = await client.query(
              "SELECT * FROM bookings WHERE id = $1",
              [bookingId]
            );

            if (result.rows.length === 0) {
              return res.status(404).json({ error: "Booking not found" });
            }

            return res.status(200).json(result.rows[0]);
          } catch (err) {
            console.error("Database error:", err);
            return res
              .status(500)
              .json({ error: "Failed to fetch booking", details: err.message });
          } finally {
            client.release();
          }
        } else if (method === "PUT") {
          // PUT /bookings/:id - Update booking
          const client = await pool.connect();
          try {
            const {
              title,
              description,
              date,
              time,
              phone_number,
              email,
              user_id,
            } = req.body;

            // Validate required fields
            if (!title || !description || !date || !time || !phone_number) {
              return res.status(400).json({
                error: "Missing required fields",
                required: [
                  "title",
                  "description",
                  "date",
                  "time",
                  "phone_number",
                ],
                received: req.body,
              });
            }

            const result = await client.query(
              "UPDATE bookings SET title = $1, description = $2, date = $3, time = $4, phone_number = $5, email = $6, user_id = $7 WHERE id = $8 RETURNING *",
              [
                title,
                description,
                date,
                time,
                phone_number,
                email || "example@gmail.com",
                user_id || "1",
                bookingId,
              ]
            );

            if (result.rows.length === 0) {
              return res.status(404).json({ error: "Booking not found" });
            }

            return res.status(200).json({
              message: "Booking updated successfully!",
              update: result.rows[0],
            });
          } catch (err) {
            console.error("Database error:", err);
            return res.status(500).json({
              error: "Failed to update booking",
              details: err.message,
            });
          } finally {
            client.release();
          }
        } else if (method === "DELETE") {
          // DELETE /bookings/:id - Delete booking
          const client = await pool.connect();
          try {
            const result = await client.query(
              "DELETE FROM bookings WHERE id = $1 RETURNING *",
              [bookingId]
            );

            if (result.rows.length === 0) {
              return res.status(404).json({ error: "Booking not found" });
            }

            return res.status(200).json({
              message: "Booking deleted successfully!",
              deleted: result.rows[0],
            });
          } catch (err) {
            console.error("Database error:", err);
            return res.status(500).json({
              error: "Failed to delete booking",
              details: err.message,
            });
          } finally {
            client.release();
          }
        } else {
          res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
          return res
            .status(405)
            .json({ error: `Method ${method} Not Allowed on /bookings/:id` });
        }
      }
    }

    // No matching route found
    return res.status(404).json({
      error: "Endpoint not found",
      requestedPath: url,
      availableEndpoints: [
        "GET /api/",
        "GET /api/bookings",
        "POST /api/bookings",
        "GET /api/bookings/:id",
        "PUT /api/bookings/:id",
        "DELETE /api/bookings/:id",
      ],
    });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};
