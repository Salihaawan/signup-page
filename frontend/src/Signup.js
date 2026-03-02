// frontend/src/Signup.js
import React, { useState } from 'react';
import axios from 'axios';
import './Signup.css'; // optional for girly styling

function Signup() {
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/signup', form);
            setMessage(res.data.message);
            setForm({ username: '', email: '', password: '' });
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error occurred');
        }
    };

    return (
        <div className="signup-container">
            <h2>🌸 Signup Page</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                />
                <button type="submit">Sign Up</button>
            </form>
            {message && <p className="message">{message}</p>}
        </div>
    );
}

export default Signup;