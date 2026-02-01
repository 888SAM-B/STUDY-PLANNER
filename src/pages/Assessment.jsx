import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle, XCircle, Trophy, SkipForward } from 'lucide-react';
import { toast } from 'react-toastify';

const Assessment = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const weekNumber = searchParams.get('week');
    const isMaster = searchParams.get('master') === 'true';

    const [loading, setLoading] = useState(true);
    const [assessment, setAssessment] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [scoreData, setScoreData] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        fetchAssessment();
    }, [id, weekNumber]);

    useEffect(() => {
        if (timeLeft > 0 && !showResults) {
            const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timerId);
        } else if (timeLeft === 0 && assessment && !showResults) {
            handleSubmit();
        }
    }, [timeLeft, showResults, assessment]);

    const fetchAssessment = async () => {
        try {
            let res;
            if (isMaster) {
                res = await api.post(`/roadmap/${id}/master-assessment`);
            } else {
                res = await api.post(`/roadmap/${id}/week/${weekNumber}/assessment`);
            }
            setAssessment(res.data.assessment);
            setTimeLeft(res.data.assessment.timeLimit * 60);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load assessment');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (option) => {
        setAnswers({
            ...answers,
            [assessment.questions[currentQuestion]._id]: option
        });
    };

    const handleSubmit = async () => {
        try {
            const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
                questionId: qId,
                selectedAnswer: ans
            }));

            const res = await api.post(`/assessment/${assessment._id}/submit`, {
                answers: formattedAnswers,
                timeTaken: (assessment.timeLimit * 60) - timeLeft
            }); // Calculate time taken 

            setScoreData(res.data);
            setShowResults(true);
        } catch (error) {
            toast.error('Submission failed');
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Assessment...</div>;
    if (!assessment) return <div className="text-center p-10">Assessment not found</div>;

    // --- RESULTS VIEW ---
    if (showResults) {
        return (
            <div className="min-h-screen p-6 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-8 rounded-2xl max-w-2xl w-full text-center"
                >
                    <Trophy className="w-20 h-20 mx-auto text-yellow-400 mb-6" />
                    <h2 className="text-3xl font-bold mb-2">Assessment Complete!</h2>
                    <p className="text-gray-400 mb-8">Here is how you performed on this module.</p>

                    <div className="flex justify-center gap-8 mb-8">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-indigo-400">{scoreData.score.toFixed(0)}%</div>
                            <div className="text-sm text-gray-500">Score</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-green-400">{scoreData.obtainedPoints}/{scoreData.totalPoints}</div>
                            <div className="text-sm text-gray-500">Points</div>
                        </div>
                    </div>

                    <div className="text-left mb-8 max-h-60 overflow-y-auto custom-scrollbar bg-gray-900/50 p-4 rounded-lg">
                        {scoreData.results.map((res, i) => (
                            <div key={i} className={`p-3 mb-2 rounded border ${res.isCorrect ? 'border-green-500/30 bg-green-900/10' : 'border-red-500/30 bg-red-900/10'}`}>
                                <p className="font-medium mb-1">{assessment.questions.find(q => q._id === res.questionId).questionText}</p>
                                <div className="flex justify-between text-sm">
                                    <span>Your Answer: <span className={res.isCorrect ? 'text-green-400' : 'text-red-400'}>{res.selectedAnswer || 'Skipped'}</span></span>
                                    {!res.isCorrect && <span className="text-green-400">Correct: {res.correctAnswer}</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4 justify-center">
                        <Link to={`/roadmap/${id}`} className="btn-primary">Back to Roadmap</Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    // --- QUIZ VIEW ---
    const question = assessment.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / assessment.questions.length) * 100;

    return (
        <div className="min-h-screen p-6 flex flex-col items-center justify-center max-w-4xl mx-auto">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-8">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white"><ArrowLeft /></button>
                <div className="flex items-center gap-2 text-xl font-mono bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                    <Clock size={20} className={timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-indigo-400'} />
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-800 h-2 rounded-full mb-12 overflow-hidden">
                <motion.div
                    animate={{ width: `${progress}%` }}
                    className="bg-indigo-500 h-full"
                />
            </div>

            {/* Question Card */}
            <div className="w-full">
                <motion.div
                    key={currentQuestion}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="glass-panel p-8 md:p-12 rounded-3xl"
                >
                    <span className="text-indigo-400 font-bold mb-4 block">Question {currentQuestion + 1} of {assessment.questions.length}</span>
                    <h2 className="text-2xl md:text-3xl font-bold mb-8">{question.questionText}</h2>

                    <div className="space-y-4">
                        {question.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(option)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${answers[question._id] === option
                                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                                        : 'border-gray-700 hover:border-gray-500 text-gray-300'
                                    }`}
                            >
                                {option}
                                {answers[question._id] === option && <CheckCircle size={20} className="text-indigo-500" />}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                    <button
                        onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestion === 0}
                        className="btn-secondary disabled:opacity-50"
                    >
                        Previous
                    </button>

                    {currentQuestion === assessment.questions.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            className="btn-primary bg-green-600 hover:bg-green-700"
                        >
                            Submit Assessment
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentQuestion(prev => Math.min(assessment.questions.length - 1, prev + 1))}
                            className="btn-primary"
                        >
                            Next Question <SkipForward size={16} className="inline ml-1" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Assessment;
