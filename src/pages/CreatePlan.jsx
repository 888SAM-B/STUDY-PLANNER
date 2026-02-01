import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { UploadCloud, FileText, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CreatePlan = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subjectName: '',
        dueValue: '',
        dueUnit: 'weeks',
        studyTimePerDay: '',
        studyDaysPerWeek: ''
    });
    const [syllabusText, setSyllabusText] = useState('');
    const [referenceFiles, setReferenceFiles] = useState([]);

    const onDropReferences = useCallback(acceptedFiles => {
        setReferenceFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps: getRefProps, getInputProps: getRefInputProps } = useDropzone({
        onDrop: onDropReferences,
        accept: { 'application/pdf': [], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [], 'text/plain': [] },
        maxFiles: 5
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!syllabusText.trim()) return toast.error('Syllabus content is required!');

        setLoading(true);
        const data = new FormData();
        data.append('subjectName', formData.subjectName);
        data.append('dueValue', formData.dueValue);
        data.append('dueUnit', formData.dueUnit);
        data.append('studyTimePerDay', formData.studyTimePerDay);
        data.append('studyDaysPerWeek', formData.studyDaysPerWeek);
        data.append('syllabusText', syllabusText); // Send text instead of file

        referenceFiles.forEach(file => {
            data.append('references', file);
        });

        try {
            const res = await api.post('/roadmap/create', data);
            toast.success('Roadmap Generated Successfully! 🚀');
            navigate(`/roadmap/${res.data.roadmapId}`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate roadmap. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-6 flex justify-center items-center">
            <div className="glass-panel p-8 rounded-2xl w-full max-w-3xl">
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/dashboard" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft />
                    </Link>
                    <h1 className="text-3xl font-bold">Create New Study Plan</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ... (subject/duration fields remain same, updating syllabus section below) ... */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="label block mb-2 text-gray-400">Subject Name</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g. Advanced Calculus"
                                value={formData.subjectName}
                                onChange={e => setFormData({ ...formData, subjectName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="label block mb-2 text-gray-400">Duration</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="4"
                                    value={formData.dueValue}
                                    onChange={e => setFormData({ ...formData, dueValue: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="label block mb-2 text-gray-400">Unit</label>
                                <select
                                    className="input-field"
                                    value={formData.dueUnit}
                                    onChange={e => setFormData({ ...formData, dueUnit: e.target.value })}
                                >
                                    <option value="weeks">Weeks</option>
                                    <option value="months">Months</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="label block mb-2 text-gray-400">Study Hours / Day</label>
                            <input
                                type="number"
                                className="input-field"
                                placeholder="2"
                                value={formData.studyTimePerDay}
                                onChange={e => setFormData({ ...formData, studyTimePerDay: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="label block mb-2 text-gray-400">Study Days / Week</label>
                            <input
                                type="number"
                                className="input-field"
                                placeholder="5"
                                max="7"
                                value={formData.studyDaysPerWeek}
                                onChange={e => setFormData({ ...formData, studyDaysPerWeek: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Syllabus Text Input */}
                    <div>
                        <label className="label block mb-2 text-gray-400">Syllabus Content (Paste here)</label>
                        <textarea
                            className="input-field min-h-[150px] resize-y"
                            placeholder="Paste your syllabus chapters, topics, or course outline here..."
                            value={syllabusText}
                            onChange={e => setSyllabusText(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    {/* References Upload */}
                    <div>
                        <label className="label block mb-2 text-gray-400">Reference Materials (Optional)</label>
                        <div {...getRefProps()} className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:bg-white/5 transition-colors">
                            <input {...getRefInputProps()} />
                            <div className="text-gray-400">
                                <p>Drag & drop reference files here</p>
                            </div>
                        </div>
                        {referenceFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {referenceFiles.map((file, idx) => (
                                    <span key={idx} className="bg-gray-700 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                                        <FileText size={12} /> {file.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-4 text-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" /> Generating AI Roadmap...
                            </>
                        ) : (
                            'Generate Roadmap 🚀'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreatePlan;
