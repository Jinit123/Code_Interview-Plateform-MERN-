const express = require("express");
const router = express.Router();

const { createRoom, joinRoom } = require("../controllers/roomController");

const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");

router.post("/create", authMiddleware, checkRole("interviewer"), createRoom);
router.post("/join", authMiddleware, checkRole("candidate"), joinRoom);

module.exports = router;