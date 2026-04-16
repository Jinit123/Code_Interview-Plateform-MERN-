import React from 'react'
import axios from "axios"
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidate"
  });

  const navigate = useNavigate();

  const BASE_URL= import.meta.env.VITE_API_URL;

  const handleRegister = async () => {
    try {
      const res = axios.post(`${BASE_URL}/api/auth/register`, form);

      alert("Register Successfully");
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Register Failed")
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 text-white">

      <div className="bg-gray-800 p-6 rounded-xl w-80">

        <h2 className="text-xl mb-4 text-center">Register</h2>

        <input
          className="w-full mb-3 p-2 rounded bg-gray-700"
          type="text"
          placeholder="Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="w-full mb-3 p-2 rounded bg-gray-700"
          type="email"
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          className="w-full mb-3 p-2 rounded bg-gray-700"
          type="password"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {/* 🔥 Role Selection */}
        <select
          className="w-full mb-3 p-2 rounded bg-gray-700"
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="candidate">Candidate</option>
          <option value="interviewer">Interviewer</option>
        </select>

        <button
          onClick={handleRegister}
          className="w-full bg-green-500 p-2 rounded hover:bg-green-600"
        >
          Register
        </button>

        <p className="text-sm mt-3 text-center">
          Already have an account?{" "}
          <Link to="/" className="text-blue-400">Login</Link>
        </p>

      </div>
    </div>
  );
};

export default Register
