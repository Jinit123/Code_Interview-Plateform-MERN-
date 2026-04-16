const express = require('express');
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");
const { register, login, checkRoleUser } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/check-role", authMiddleware, checkRole("candidate"), checkRoleUser);

module.exports = router;