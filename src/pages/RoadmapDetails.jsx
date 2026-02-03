import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { ChevronDown, ChevronUp, CheckCircle, Circle, Play, Award, FileText, ArrowLeft, Loader2, Calendar, Clock, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const RoadmapDetails = () => {
    const { id } = useParams();
    const [roadmap, setRoadmap] = useState(null);
    const [expandedWeek, setExpandedWeek] = useState(null);
    const [activeDay, setActiveDay] = useState(0);
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
            if (currentWeek) {
                setExpandedWeek(currentWeek.weekNumber);
                setActiveDay(0);
            }
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

    const toggleWeek = (weekNum) => {
        if (expandedWeek === weekNum) {
            setExpandedWeek(null);
        } else {
            setExpandedWeek(weekNum);
            setActiveDay(0); // Reset to first day when opening a new week
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
                    <p className="text-gray-400 flex items-center gap-4 text-sm md:text-base">
                        <span className="flex items-center gap-1"><Calendar size={16} /> {roadmap.totalWeeks} Weeks</span>
                        <span className="flex items-center gap-1"><Clock size={16} /> {roadmap.studyTimePerDay} hrs/day</span>
                        <span className="flex items-center gap-1"><CheckCircle size={16} /> {roadmap.overallProgress}% Complete</span>
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
                            onClick={() => toggleWeek(week.weekNumber)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono ${week.status === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'
                                    }`}>
                                    {week.weekNumber}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Week {week.weekNumber}</h3>
                                    <p className="text-sm text-gray-400">{week.topics.length} Key Topics</p>
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
                                            {(() => {
                                                const isFirstWeek = week.weekNumber === 1;
                                                const prevWeek = roadmap.weeklyContent.find(w => w.weekNumber === week.weekNumber - 1);
                                                const isLocked = !isFirstWeek && (!prevWeek || prevWeek.status !== 'completed');

                                                if (week.status === 'completed') {
                                                    return (
                                                        <div className="flex items-center gap-2 text-green-400 font-semibold px-4 py-2 bg-green-900/20 rounded-lg border border-green-500/30">
                                                            <CheckCircle size={20} /> Week Completed
                                                        </div>
                                                    );
                                                }

                                                if (week.status === 'ongoing') {
                                                    return (
                                                        <button
                                                            onClick={() => updateStatus(week.weekNumber, 'completed')}
                                                            className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                                                        >
                                                            <CheckCircle size={18} /> Mark as Completed
                                                        </button>
                                                    );
                                                }

                                                if (isLocked) {
                                                    return (
                                                        <div className="flex items-center gap-2 text-gray-500 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700 border-dashed cursor-not-allowed">
                                                            <Award size={18} /> Locked - Complete previous week first
                                                        </div>
                                                    );
                                                }

                                                // If not started and unlocked
                                                return (
                                                    <button
                                                        onClick={() => updateStatus(week.weekNumber, 'ongoing')}
                                                        className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-2 transition-all"
                                                    >
                                                        <Play size={18} /> Start Week
                                                    </button>
                                                );
                                            })()}
                                        </div>

                                        {/* Daily Schedule Section */}
                                        <div className="mb-8">
                                            <h4 className="text-indigo-400 font-medium mb-4 flex items-center gap-2">
                                                <Circle size={16} fill="currentColor" /> Daily Schedule
                                            </h4>

                                            {week.dailyPlan && week.dailyPlan.length > 0 ? (
                                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {week.dailyPlan.map((day, idx) => (
                                                        <div key={idx} className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                                                            <h5 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                                                <Calendar size={16} className="text-indigo-400" />
                                                                {day.day}
                                                            </h5>
                                                            <div className="space-y-2 pl-2">
                                                                {day.topics.map((topic, tIdx) => (
                                                                    <div key={tIdx} className="flex gap-2">
                                                                        <div className="mt-1">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                                                                        </div>
                                                                        <p className="text-gray-300 text-xs leading-relaxed">{topic}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {week.topics.map((topic, i) => (
                                                        <li key={i} className="text-gray-300 flex items-start gap-2">
                                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0"></span>
                                                            {topic}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        {/* Cheat Sheet Section */}
                                        <div className="mb-8">
                                            <h4 className="text-pink-400 font-medium mb-4 flex items-center gap-2">
                                                <FileText size={16} /> Cheat Sheet
                                            </h4>
                                            <div className="bg-gray-900/50 p-4 rounded-lg text-sm text-gray-300 leading-relaxed border border-gray-700 prose prose-sm prose-invert max-w-none">
                                                <ReactMarkdown>{week.cheatSheet}</ReactMarkdown>
                                            </div>
                                        </div>

                                        {/* Learning Resources Section */}
                                        {week.resourceLinks && week.resourceLinks.length > 0 && (
                                            <div className="mt-8">
                                                <h4 className="text-emerald-400 font-medium mb-4 flex items-center gap-2">
                                                    <BookOpen size={16} /> Learning Resources
                                                </h4>
                                                <div className="grid md:grid-cols-2 gap-3">
                                                    {week.resourceLinks.map((resource, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={resource.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="group bg-gradient-to-br from-gray-800/40 to-gray-800/20 hover:from-emerald-900/30 hover:to-emerald-800/20 rounded-lg p-4 border border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300"
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex-1">
                                                                    <h5 className="text-white font-semibold text-sm mb-1 group-hover:text-emerald-300 transition-colors">
                                                                        {resource.title}
                                                                    </h5>
                                                                    {resource.description && (
                                                                        <p className="text-gray-400 text-xs leading-relaxed">
                                                                            {resource.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <svg
                                                                    className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-0.5"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

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
