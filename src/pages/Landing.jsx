import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Award, ArrowRight } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] opacity-30"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600 rounded-full blur-[120px] opacity-30"></div>
            </div>

            {/* Navbar */}
            <nav className="flex justify-between items-center p-6 container mx-auto">
                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-500">
                    Academix
                </div>
                <div className="flex gap-4">
                    <Link to="/login" className="btn-secondary">Login</Link>
                    <Link to="/register" className="btn-primary">Get Started</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="container mx-auto px-6 py-20 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                        Your Personal AI <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-500">
                            Study Architect
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                        Upload your syllabus, set your goals, and let our AI create the perfect roadmap for your success.
                        Track progress, take assessments, and master your subjects.
                    </p>

                    <Link to="/register" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
                        Start Planning Now <ArrowRight size={20} />
                    </Link>
                </motion.div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 mt-24 w-full">
                    {[
                        { icon: <BookOpen size={32} className="text-indigo-400" />, title: "Smart Syllabus Analysis", desc: "Upload PDFs or Docs. Our AI extracts key topics and structures them perfectly." },
                        { icon: <Calendar size={32} className="text-pink-400" />, title: "Dynamic Scheduling", desc: "Get a week-by-week plan tailored to your available study hours and deadlines." },
                        { icon: <Award size={32} className="text-yellow-400" />, title: "AI Assessments", desc: "Test your knowledge with weekly quizzes and comprehensive master assessments." }
                    ].map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.2 }}
                            viewport={{ once: true }}
                            className="glass-panel p-8 rounded-2xl hover:scale-105 transition-transform duration-300"
                        >
                            <div className="mb-4 p-3 bg-white/5 rounded-lg w-fit">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-gray-400">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Landing;
