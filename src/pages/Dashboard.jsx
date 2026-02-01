import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Plus, Book, Clock, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const [roadmaps, setRoadmaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();

    useEffect(() => {
        fetchRoadmaps();
    }, []);

    const fetchRoadmaps = async () => {
        try {
            const res = await api.get('/roadmap/my-roadmaps');
            setRoadmaps(res.data.roadmaps);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    }

    return (
        <div className="min-h-screen p-6 md:p-12">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Hello, {user?.name} 👋</h1>
                    <p className="text-gray-400">Ready to master your subjects today?</p>
                </div>
                <div className="flex gap-4">
                    <Link to="/create-plan" className="btn-primary flex items-center gap-2">
                        <Plus size={20} /> New Plan
                    </Link>
                    <button onClick={handleLogout} className="btn-secondary">Logout</button>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center mt-20">Loading layouts...</div>
            ) : roadmaps.length === 0 ? (
                <div className="text-center py-20 glass-panel rounded-2xl">
                    <Book size={48} className="mx-auto text-gray-500 mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Study Plans Yet</h3>
                    <p className="text-gray-400 mb-6">Create your first AI-powered roadmap to get started.</p>
                    <Link to="/create-plan" className="btn-primary inline-flex items-center gap-2">
                        <Plus size={20} /> Create Roadmap
                    </Link>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roadmaps.map((roadmap) => (
                        <motion.div
                            key={roadmap._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -5 }}
                            className="glass-panel p-6 rounded-2xl cursor-pointer group"
                            onClick={() => navigate(`/roadmap/${roadmap._id}`)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                                    <Book size={24} />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${roadmap.overallProgress === 100 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {roadmap.overallProgress}% Complete
                                </span>
                            </div>

                            <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">
                                {roadmap.subjectName}
                            </h3>

                            <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                                <div className="flex items-center gap-1">
                                    <Clock size={16} />
                                    {roadmap.totalWeeks} Weeks
                                </div>
                                <div className="flex items-center gap-1">
                                    <BarChart2 size={16} />
                                    {roadmap.weeklyContent.length} Modules
                                </div>
                            </div>

                            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full transition-all duration-500"
                                    style={{ width: `${roadmap.overallProgress}%` }}
                                ></div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
