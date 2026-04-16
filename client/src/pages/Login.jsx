import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react';
import axios from "axios"

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const navigate = useNavigate();
  
  const BASE_URL= import.meta.env.VITE_API_URL;

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, form);

      console.log(res);


      // localStorage.setItem("token", res.data.token);
      // localStorage.setItem("user", JSON.stringify(res.data.user));

      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/dashboard");
    } catch (error) {
      console.log(error)
      alert("Login Failed");
    }
  }
  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 text-white">

      <div className="bg-gray-800 p-6 rounded-xl w-80">

        <h2 className="text-xl mb-4 text-center">Login</h2>

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

        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 p-2 rounded hover:bg-blue-600"
        >
          Login
        </button>

        <p className="text-sm mt-3 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-400">Register</Link>
        </p>

      </div>
    </div>
  );
};

export default Login
