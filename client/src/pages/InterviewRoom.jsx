import { useEffect, useState } from "react";
import socket from "../socket";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react"
import axios from "axios"
import { useRef } from "react";
import toast from "react-hot-toast"

const InterviewRoom = () => {
    const { roomId } = useParams();

    const [code, setCode] = useState("");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [output, setOutput] = useState("");
    const [participants, setParticipants] = useState([]);
    const [typingUser, setTypingUser] = useState("");

    const [isMuted, setIsMuted] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const peerConnection = useRef(null);
    const remoteAudioRef = useRef();

    // const user = JSON.parse(localStorage.getItem("user"));
    const user = JSON.parse(sessionStorage.getItem("user"));

    const navigate = useNavigate();

    const BASE_URL = import.meta.env.VITE_API_URL;

    const toggleMute = () => {
        if (!localStream) return;

        const audioTrack = localStream.getAudioTracks()[0];

        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    };

    const startVoice = async () => {

        console.log("Start Voice Button Clicked");

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
        });

        console.log("Mic Access Granted");

        setLocalStream(stream);

        peerConnection.current = new RTCPeerConnection();
        console.log("Peer Connection Created");

        // send audio track
        stream.getTracks().forEach((track) => {
            peerConnection.current.addTrack(track, stream);
        });

        // receive audio
        // peerConnection.current.ontrack = (event) => {
        //     console.log("Receiving Audio");
        //     remoteAudioRef.current.srcObject = event.streams[0];
        // };

        peerConnection.current.ontrack = (event) => {
            console.log("🎧 Receiving audio");

            const audioEl = remoteAudioRef.current;
            audioEl.srcObject = event.streams[0];

            audioEl.play().then(() => {
                console.log("🔊 Audio playing");
            }).catch((err) => {
                console.log("❌ Play blocked:", err);
            });
        };

        // ICE candidate
        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("Sending ICE");
                socket.emit("ice-candidate", {
                    roomId,
                    candidate: event.candidate,
                });
            }
        };
    };

    const createOffer = async () => {
        console.log("Call Button Clicked");

        if (!peerConnection.current) {
            console.log("Peer Connection is not ready");
            return;

        }

        const offer = await peerConnection.current.createOffer();
        console.log("Offer Created");

        await peerConnection.current.setLocalDescription(offer);

        socket.emit("offer", { roomId, offer });
        console.log("Offer Sent");

    };

    const handleLogout = () => {

        socket.disconnect();

        sessionStorage.clear();
        navigate("/");
    };



    useEffect(() => {

        // setParticipants([user]);
        setParticipants((prev) => {
            if (prev.find(p => p.name === user.name)) return prev;
            return [user];
        });

        socket.emit("join-room", {
            roomId,
            user
        });

        // code sync
        const handleCodeUpdate = (newCode) => {
            setCode(newCode);
        };

        // chat receive
        const handleMessage = (data) => {
            setMessages((prev) => [...prev, data]);
        };

        const handleUserJoined = (newUser) => {
            setParticipants((prev) => {
                if (prev.find((p) => p.name === newUser.name)) return prev;
                return [...prev, newUser];
            });

            if (newUser.name !== user.name) {
                toast.success(`${newUser.name} joined the room`, {
                    style: {
                        background: "#1f2937",
                        color: "#fff"
                    }
                })
            }
        };

        // const handleExistingUsers = (users) => {
        //     setParticipants(users);
        // };

        const handleExistingUsers = (users) => {
            setParticipants((prev) => {
                const updated = [...prev];

                users.forEach((u) => {
                    if (!updated.find((p) => p.name === u.name)) {
                        updated.push(u);
                    }
                });

                return updated;
            });
        };

        const handleUserLeft = (name) => {
            setParticipants((prev) => prev.filter((p) => p.name !== name));

            toast(`${name} left the room`);
        };

        const handleTyping = (userName) => {
            setTypingUser(userName);
        };

        const handleStopTyping = () => {
            setTypingUser("");
        };

        socket.on("offer", async ({ offer }) => {
            console.log("Offer Received");

            if (!peerConnection.current) {
                console.log("Receiver peerconnection NUll");
                return;

            }

            await peerConnection.current.setRemoteDescription(offer);

            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            socket.emit("answer", { roomId, answer });
            console.log("Answer Sent");

        });

        socket.on("answer", async ({ answer }) => {
            console.log("Answer Received");

            await peerConnection.current.setRemoteDescription(answer);
        });

        socket.on("ice-candidate", async ({ candidate }) => {
            console.log("ICE Received");

            if (!peerConnection.current) return;
            await peerConnection.current.addIceCandidate(candidate);
        });

        socket.on("user-typing", handleTyping);
        socket.on("user-stop-typing", handleStopTyping);

        socket.on("user-left", handleUserLeft);

        socket.on("existing-users", handleExistingUsers);

        socket.on("user-joined", handleUserJoined);
        socket.on("code-update", handleCodeUpdate);
        socket.on("receive-message", handleMessage);

        return () => {
            socket.off("code-update", handleCodeUpdate);
            socket.off("receive-message", handleMessage);
            socket.off("user-joined", handleUserJoined);
            socket.off("existing-users", handleExistingUsers);
            socket.off("user-left", handleUserLeft);
            socket.off("user-typing", handleTyping);
            socket.off("user-stop-typing", handleStopTyping);
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
        };
    }, [roomId]);

    useEffect(() => {

    }, []);

    const handleCodeChange = (e) => {
        const newCode = e.target.value;
        setCode(newCode);

        socket.emit("code-change", {
            roomId,
            code: newCode,
        });
    };

    // send message
    const sendMessage = () => {
        if (!message.trim()) return;

        const msgData = {
            roomId,
            message,
            user: user.name, // later dynamic करेंगे
        };

        socket.emit("chat-message", msgData);

        setMessages((prev) => [...prev, msgData]);
        setMessage("");
    };

    const runCode = async () => {
        try {
            const response = await fetch(
                "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        source_code: code,
                        language_id: 63, // JavaScript
                    }),
                }
            );

            const data = await response.json();

            setOutput(data.stdout || data.stderr || "No output");

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="h-screen bg-gray-900 text-white p-2 md:p-4 flex flex-col">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 bg-gray-800 p-3 rounded-xl gap-2">

                <div>
                    <h2 className="font-semibold text-sm md:text-base">Room: {roomId}</h2>
                    <p className="text-xs md:text-sm text-gray-400">User: {user.name}</p>
                </div>

                <button
                    onClick={toggleMute}
                    className={`px-3 py-1 rounded text-sm ${isMuted ? "bg-red-500" : "bg-green-500"
                        }`}
                >
                    {isMuted ? "Unmute 🎤" : "Mute 🔇"}
                </button>

                <div className="flex gap-2 mb-2">
                    <button
                        onClick={startVoice}
                        className="bg-green-500 px-3 py-1 rounded"
                    >
                        Start Voice
                    </button>

                    <button
                        onClick={createOffer}
                        className="bg-blue-500 px-3 py-1 rounded"
                    >
                        Call
                    </button>
                </div>

                {/* <audio ref={remoteAudioRef} autoPlay /> */}
                <audio ref={remoteAudioRef} autoPlay playsInline controls />

                <div className="flex gap-2">
                    <button
                        onClick={() => navigator.clipboard.writeText(window.location.href)}
                        className="bg-yellow-500 px-2 md:px-3 py-1 text-sm rounded hover:bg-yellow-600"
                    >
                        Copy
                    </button>

                    <button
                        onClick={handleLogout}
                        className="bg-red-500 px-2 md:px-3 py-1 text-sm rounded hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>

            </div>

            {/* Main Layout */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 flex-1 overflow-hidden">

                {/* Editor */}
                <div className="lg:col-span-2 bg-gray-800 p-2 rounded-xl h-[40%] lg:h-full">
                    <Editor
                        height="100%"
                        theme="vs-dark"
                        defaultLanguage="javascript"
                        value={code}
                        onChange={(value) => {
                            setCode(value || "");

                            socket.emit("code-change", {
                                roomId,
                                code: value || "",
                            });
                        }}
                    />
                </div>


                {/* Chat Section */}
                <div className="bg-gray-800 p-3 rounded-xl flex flex-col h-[60%] lg:h-full">

                    {/* Participants */}
                    <div className="mb-3">
                        <h3 className="text-xs md:text-sm text-gray-400 mb-1">Participants</h3>

                        <div className="flex flex-wrap flex-col gap-1">
                            {participants.map((p, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-700 px-2 py-1 rounded text-sm flex items-center gap-1"
                                >
                                    {p.name}
                                    {p.role === "interviewer" && (
                                        <span className="text-yellow-400 text-[10px]">Host</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* Chat */}
                    <div className="flex-1 overflow-y-auto mb-2 flex flex-col gap-2">

                        <hr />
                        <h3 className="text-xs md:text-sm text-gray-400">Messages</h3>

                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`p-2 rounded max-w-[85%] text-sm ${msg.user === user.name
                                    ? "bg-blue-500 self-end"
                                    : "bg-gray-700 self-start"
                                    }`}
                            >
                                <p className="text-[13px] font-semibold">{msg.user}</p>
                                <p>{msg.message}</p>
                            </div>
                        ))}

                    </div>

                    {typingUser && typingUser !== user.name && (
                        <p className="text-xs text-gray-400 italic mb-1">
                            {typingUser} is typing...
                        </p>
                    )}

                    {/* Input */}
                    <div className="flex gap-2">
                        <input
                            className="flex-1 p-2 rounded bg-gray-700 text-sm outline-none"
                            type="text"
                            value={message}
                            onChange={(e) => {
                                setMessage(e.target.value);

                                socket.emit("typing", {
                                    roomId,
                                    user: user.name
                                });

                                setTimeout(() => {
                                    socket.emit("stop-typing", {
                                        roomId,
                                        user: user.name
                                    });
                                }, 1000);
                            }}
                            placeholder="Message..."
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-blue-500 px-3 text-sm rounded hover:bg-blue-600"
                        >
                            Send
                        </button>
                    </div>

                </div>
            </div>

            {/* Bottom Console */}
            <div className="mt-3 bg-gray-800 p-3 rounded-xl">

                <button
                    onClick={runCode}
                    className="bg-green-500 px-3 py-1 text-sm rounded hover:bg-green-600"
                >
                    Run
                </button>

                <div className="mt-2 bg-black p-3 rounded text-green-400 text-xs md:text-sm font-mono overflow-auto max-h-[120px]">
                    <pre>{output}</pre>
                </div>

            </div>

        </div>
    );
};

export default InterviewRoom;