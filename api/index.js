const cors = require("./_cors");

module.exports = (req, res) => {
  if (cors(req, res)) return;
  res.status(200).send("Booking System API is running!");
};
