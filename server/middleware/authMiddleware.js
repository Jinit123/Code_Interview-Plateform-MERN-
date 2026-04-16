const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {

    try {
        const authHeader = req.headers.authorization;
        // console.log("Header:", authHeader);


        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "no token provided" });
        }

        const token = authHeader.split(" ")[1];
        // console.log("JWT TOKEN:", token);

        const decoded = jwt.verify(token, process.env.SECRET);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User is not found" });
        }

        req.user = user;

        next();
    } catch (error) {
        console.log("JWT Error:", error.message);
        return res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = authMiddleware;