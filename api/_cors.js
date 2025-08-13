module.exports = function applyCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173"); // change for production
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true; // tells caller to stop processing
  }

  return false; // continue normal route
};
