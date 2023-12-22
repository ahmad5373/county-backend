const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const secretKey = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
    // get token from passed headers
    const token = req.header("Authorization")?.replace("Bearer ", "");

    // return message unauthorize when token not provided in headers
    if (!token) {
        return res.status(401).send({ error: "Unauthorized User" });
    }

    try {
        // verify token
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;

        next(); // move next to proceed further
    } catch (error) {
        console.error("Authentication error:", error.message);
        return res.status(401).send({ error: "Unauthorized user." });
    }
};
