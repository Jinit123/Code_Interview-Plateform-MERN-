const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const checkRole = require("./middleware/checkRole");
const http = require("http")
const { Server } = require("socket.io");

dotenv.config();

const app = express();

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

app.use(cors());
app.use(express.json())


app.use("/api/auth", authRoutes);
app.use("/api/room", roomRoutes);

app.get("/api/test", authMiddleware, (req, res) => {
    res.json({
        message: "Protected Route Working",
        user: req.user
    })
});

app.get("/api/interviewer-only", authMiddleware, checkRole("interviewer"), (req, res) => {
    res.json({
        message: "Welcome Interviewer"
    })
});

app.get("/api/candidate-only", authMiddleware, checkRole("candidate"), (req, res) => {
    res.json({
        message: "Welcome Candidate"
    })
});
const rooms = {};
const socketUserMap = {};

io.on("connection", (socket) => {
    console.log("User Connected", socket.id);

    socket.on("join-room", ({ roomId, user }) => {

        console.log("Join Event Received", user, roomId);

        socket.join(roomId);

        socketUserMap[socket.id] = {
            roomId,
            name: user.name,
            role: user.role
        };

        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }

        // ✅ duplicate avoid
        if (!rooms[roomId].find(u => u.name === user.name)) {
            rooms[roomId].push(user);
        }

        console.log("Sending Participants:", rooms[roomId]);


        console.log("Room State:", rooms[roomId]);
        console.log(`${user.name} joined room: ${roomId}`);

        io.to(roomId).emit("participants-update", rooms[roomId]);
    });

    socket.on("code-change", ({ roomId, code }) => {
        socket.to(roomId).emit("code-update", code);
    });

    socket.on("chat-message", ({ roomId, message, user }) => {
        socket.to(roomId).emit("receive-message", {
            message,
            user
        });
    });

    socket.on("typing", ({ roomId, user }) => {
        socket.to(roomId).emit("user-typing", user);
    });

    socket.on("stop-typing", ({ roomId, user }) => {
        socket.to(roomId).emit("user-stop-typing", user);
    });

    socket.on("offer", ({ roomId, offer }) => {
        socket.to(roomId).emit("offer", { offer });
    });

    socket.on("answer", ({ roomId, answer }) => {
        socket.to(roomId).emit("answer", { answer });
    });

    socket.on("ice-candidate", ({ roomId, candidate }) => {
        socket.to(roomId).emit("ice-candidate", { candidate });
    });

    socket.on("disconnect", () => {
        const userData = socketUserMap[socket.id];

        if (userData) {
            const { roomId, name } = userData;

            rooms[roomId] = rooms[roomId]?.filter(u => u.name !== name);

            console.log("After Disconnect:", rooms[roomId]);

            io.to(roomId).emit("participants-update", rooms[roomId]);

            delete socketUserMap[socket.id];

            console.log("User Disconnected", socket.id);
        }
    });
});

const PORT = process.env.PORT;

server.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
})