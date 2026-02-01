import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/register', formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.success('Registration Successful!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration Failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-pink-600 rounded-full blur-[150px] opacity-20"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-8 rounded-2xl w-full max-w-md"
            >
                <h2 className="text-3xl font-bold mb-6 text-center">Create Account</h2>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-400">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            className="input-field"
                            placeholder="John Doe"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-400">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="input-field"
                            placeholder="you@example.com"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-400">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="input-field"
                            placeholder="••••••••"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full">Sign Up</button>
                </form>

                <p className="mt-6 text-center text-gray-400">
                    Already have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Login</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
