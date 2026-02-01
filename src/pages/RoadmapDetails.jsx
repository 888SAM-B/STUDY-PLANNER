import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { ChevronDown, ChevronUp, CheckCircle, Circle, Play, Award, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RoadmapDetails = () => {
    const { id } = useParams();
    const [roadmap, setRoadmap] = useState(null);
    const [expandedWeek, setExpandedWeek] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRoadmap();
    }, [id]);

    const fetchRoadmap = async () => {
        try {
            const res = await api.get(`/roadmap/${id}`);
            setRoadmap(res.data.roadmap);
            // Auto expand the first not-started or ongoing week
            const currentWeek = res.data.roadmap.weeklyContent.find(w => w.status !== 'completed');
            if (currentWeek) setExpandedWeek(currentWeek.weekNumber);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (weekNumber, status) => {
        try {
            await api.put(`/roadmap/${id}/week/${weekNumber}/status`, { status });
            fetchRoadmap(); // Refresh to update progress
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-10 h-10 text-indigo-500" /></div>;
    if (!roadmap) return <div className="text-center p-10">Roadmap not found</div>;

    return (
        <div className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto">
            <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
                <ArrowLeft size={20} /> Back to Dashboard
            </Link>

            <header className="mb-10 flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-4xl font-bold mb-2">{roadmap.subjectName}</h1>
                    <p className="text-gray-400">
                        {roadmap.totalWeeks} Weeks • {roadmap.studyTimePerDay} hrs/day • {roadmap.overallProgress}% Complete
                    </p>
                </div>
                <div className="w-full md:w-1/3">
                    <div className="bg-gray-800 h-3 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${roadmap.overallProgress}%` }}
                            className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full"
                        ></motion.div>
                    </div>
                </div>
            </header>

            <div className="space-y-4">
                {roadmap.weeklyContent.map((week) => (
                    <motion.div
                        key={week.weekNumber}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: week.weekNumber * 0.05 }}
                        className={`glass-panel rounded-xl overflow-hidden border transition-all ${week.status === 'completed' ? 'border-green-500/30 bg-green-900/10' :
                                week.weekNumber === expandedWeek ? 'border-indigo-500/50' : 'border-gray-700'
                            }`}
                    >
                        <div
                            className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => setExpandedWeek(expandedWeek === week.weekNumber ? null : week.weekNumber)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono ${week.status === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'
                                    }`}>
                                    {week.weekNumber}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Week {week.weekNumber}</h3>
                                    <p className="text-sm text-gray-400">{week.topics.length} Topics</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {week.status === 'completed' && <span className="text-green-400 text-sm font-medium flex items-center gap-1"><CheckCircle size={16} /> Completed</span>}
                                {expandedWeek === week.weekNumber ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedWeek === week.weekNumber && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-6 pt-0 border-t border-gray-700/50">

                                        {/* Status Control */}
                                        <div className="flex gap-2 my-6">
                                            {['not-started', 'ongoing', 'completed'].map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => updateStatus(week.weekNumber, status)}
                                                    className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${week.status === status
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                        }`}
                                                >
                                                    {status.replace('-', ' ')}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div>
                                                <h4 className="text-indigo-400 font-medium mb-3 flex items-center gap-2">
                                                    <Circle size={16} fill="currentColor" /> Topics to Study
                                                </h4>
                                                <ul className="space-y-2">
                                                    {week.topics.map((topic, i) => (
                                                        <li key={i} className="text-gray-300 flex items-start gap-2">
                                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0"></span>
                                                            {topic}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div>
                                                <h4 className="text-pink-400 font-medium mb-3 flex items-center gap-2">
                                                    <FileText size={16} /> Cheat Sheet
                                                </h4>
                                                <div className="bg-gray-900/50 p-4 rounded-lg text-sm text-gray-300 leading-relaxed border border-gray-700">
                                                    {week.cheatSheet}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 flex justify-end">
                                            {week.status === 'completed' && (
                                                <Link
                                                    to={`/assessment/${roadmap._id}?week=${week.weekNumber}`}
                                                    className={`btn-primary flex items-center gap-2 ${week.assessmentCompleted ? 'bg-green-600 hover:bg-green-700' : ''
                                                        }`}
                                                >
                                                    {week.assessmentCompleted ? (
                                                        <>Assessment Score: {week.assessmentScore}% <Award size={18} /></>
                                                    ) : (
                                                        <>Take Assessment <Play size={18} /></>
                                                    )}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            {/* Master Assessment Button */}
            {roadmap.overallProgress >= 90 && (
                <div className="mt-12 text-center">
                    <h3 className="text-2xl font-bold mb-4">Ready for the Final Challenge? 🏆</h3>
                    <Link to={`/assessment/${roadmap._id}?master=true`} className="btn-primary text-xl px-10 py-5">
                        {roadmap.masterAssessmentCompleted ? `Master Assessment: ${roadmap.masterAssessmentScore}%` : 'Take Master Assessment'}
                    </Link>
                </div>
            )}
        </div>
    );
};

export default RoadmapDetails;
