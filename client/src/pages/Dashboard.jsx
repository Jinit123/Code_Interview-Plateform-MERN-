import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {

  const navigate = useNavigate();

  // const user = JSON.parse(localStorage.getItem("user"));
  // const token = localStorage.getItem("token");

  const user = JSON.parse(sessionStorage.getItem("user"));
const token = sessionStorage.getItem("token");

  const [roomId, setRoomId] = useState("");

  const createRoom = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/room/create", {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      const newRoomId = res.data.room.roomId;

      navigate(`/room/${newRoomId}`);

    } catch (error) {
      console.error(error);
      alert("Failed to create room");
    }
  }

  const joinRoom = () => {
    if (!roomId) {
      alert("Enter Room ID")
      return;
    }

    navigate(`/room/${roomId}`);
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 text-white">

      <div className="bg-gray-800 p-6 rounded-xl w-96 text-center">

        <h2 className="text-xl mb-2">Welcome, {user.name}</h2>
        <p className="text-gray-400 mb-4">Role: {user.role}</p>

        {/* 🔥 Interviewer UI */}
        {user.role === "interviewer" && (
          <button
            onClick={createRoom}
            className="w-full bg-blue-500 p-2 rounded hover:bg-blue-600"
          >
            Create Interview Room
          </button>
        )}

        {/* 🔥 Candidate UI */}
        {user.role === "candidate" && (
          <>
            <input
              className="w-full mb-3 p-2 rounded bg-gray-700 mt-2"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />

            <button
              onClick={joinRoom}
              className="w-full bg-green-500 p-2 rounded hover:bg-green-600"
            >
              Join Room
            </button>
          </>
        )}

      </div>
    </div>
  );
};


export default Dashboard
