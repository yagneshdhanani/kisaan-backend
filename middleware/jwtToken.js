const jwt = require("jsonwebtoken");

const verifyToken = async (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) return res.send({ message: "Access denied.", code: 401 });

  try {
    const decoded = await jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.send({ message: error.message, code: 401 });
  }
};

module.exports = {
  verifyToken,
};
