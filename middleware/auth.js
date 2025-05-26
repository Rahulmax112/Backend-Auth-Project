const jwt = require("jsonwebtoken");

const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) res.status(401).json({ error: "Unauthorized or token expired" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: "Token Expired or Invalid" });
  }
};



module.exports = {verifyToken};
