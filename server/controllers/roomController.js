const Room = require("../models/Room");
const { v4: uuidv4 } = require("uuid");

exports.createRoom = async (req, res) => {
    try {
        const roomId = uuidv4();

        const room = await Room.create({
            roomId,
            createdBy: req.user._id,
            participants: [req.user._id]
        });

        res.status(201).json({
            message: "Room Created",
            room
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.joinRoom = async (req, res) => {
    try {

        const { roomId } = req.body;
        console.log("Req.body for join room:", req.body);

        const room = await Room.findOne({ roomId });

        if (!roomId) {
            return res.status(404).json({ message: "Room not found" });
        }

        res.json({
            message: "Joined Room Successfully",
            room
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};