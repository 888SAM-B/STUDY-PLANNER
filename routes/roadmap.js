const express = require('express');
const router = express.Router();
const Roadmap = require('../models/Roadmap');
const Assessment = require('../models/Assessment');
const authMiddleware = require('../middleware/auth');
const upload = require('../utils/fileUpload');
const { extractTextFromFile } = require('../utils/textExtractor');
const { generateRoadmap, generateWeeklyAssessment, generateMasterAssessment } = require('../utils/aiGenerator');

// Create Roadmap (Upload Syllabus & Generate Plan)
router.post('/create', authMiddleware, upload.fields([
    { name: 'syllabus', maxCount: 1 },
    { name: 'references', maxCount: 5 }
]), async (req, res) => {
    try {
        console.log('Request Body:', req.body);
        console.log('Request Files:', req.files);

        const { subjectName, dueValue, dueUnit, studyTimePerDay, studyDaysPerWeek, syllabusText: bodySyllabusText } = req.body;

        let syllabusText = '';
        let syllabusFile = null;

        // 1. Determine Syllabus Source
        if (bodySyllabusText && bodySyllabusText.trim()) {
            syllabusText = bodySyllabusText;
        } else if (req.files && req.files.syllabus) {
            syllabusFile = req.files.syllabus[0];
            syllabusText = await extractTextFromFile(syllabusFile.path);
        } else {
            console.error('Missing syllabus');
            return res.status(400).json({ success: false, message: 'Syllabus content (text or file) is required' });
        }

        // 2. Extract text from References (if any)
        let referencesText = '';
        if (req.files.references) {
            for (const file of req.files.references) {
                const text = await extractTextFromFile(file.path);
                referencesText += `\n--- Content from ${file.originalname} ---\n${text}\n`;
            }
        }

        // 3. Generate Roadmap using AI
        const studyParams = {
            dueTime: { value: parseInt(dueValue), unit: dueUnit },
            studyTimePerDay: parseFloat(studyTimePerDay),
            studyDaysPerWeek: parseInt(studyDaysPerWeek)
        };

        const weeklyPlan = await generateRoadmap(syllabusText, referencesText, studyParams);

        // 4. Save to Database
        const roadmapData = {
            userId: req.userId,
            subjectName,
            syllabusInput: syllabusFile ? 'file' : 'text',
            syllabusTextContent: syllabusFile ? null : syllabusText,
            referenceMaterials: req.files.references ? req.files.references.map(f => ({
                fileName: f.originalname,
                filePath: f.path,
                fileType: f.mimetype
            })) : [],
            dueTime: { value: parseInt(dueValue), unit: dueUnit },
            studyTimePerDay: parseFloat(studyTimePerDay),
            studyDaysPerWeek: parseInt(studyDaysPerWeek),
            totalWeeks: weeklyPlan.length,
            weeklyContent: weeklyPlan.map(week => ({
                weekNumber: week.weekNumber,
                topics: week.topics,
                studyMaterials: week.studyMaterials,
                cheatSheet: week.cheatSheet,
                status: week.weekNumber === 1 ? 'ongoing' : 'not-started'
            }))
        };

        if (syllabusFile) {
            roadmapData.syllabusFile = {
                fileName: syllabusFile.originalname,
                filePath: syllabusFile.path,
                fileType: syllabusFile.mimetype
            };
        }

        const roadmap = new Roadmap(roadmapData);

        await roadmap.save();

        res.status(201).json({
            success: true,
            message: 'Roadmap generated successfully',
            roadmapId: roadmap._id,
            roadmap
        });

    } catch (error) {
        console.error('Roadmap Creation Error:', error);

        // Handle quota exceeded errors specifically
        if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('429')) {
            return res.status(429).json({
                success: false,

                message: 'AI service quota exceeded. Please try again later or upgrade your plan.',
                error: 'QUOTA_EXCEEDED',
                details: 'The free tier API quota has been exhausted. Please wait for the quota to reset or consider upgrading to a paid plan.'
            });
        }

        res.status(500).json({ success: false, message: 'Failed to create roadmap', error: error.message });
    }
});

// Get All Roadmaps for User
router.get('/my-roadmaps', authMiddleware, async (req, res) => {
    try {
        const roadmaps = await Roadmap.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json({ success: true, roadmaps });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Get Single Roadmap
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.userId });
        if (!roadmap) {
            return res.status(404).json({ success: false, message: 'Roadmap not found' });
        }
        res.json({ success: true, roadmap });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Update Weekly Status
router.put('/:id/week/:weekNumber/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.userId });

        if (!roadmap) {
            return res.status(404).json({ success: false, message: 'Roadmap not found' });
        }

        const weekIndex = roadmap.weeklyContent.findIndex(w => w.weekNumber == req.params.weekNumber);
        if (weekIndex === -1) {
            return res.status(404).json({ success: false, message: 'Week not found' });
        }

        // Logic for sequential progress
        if (status === 'completed') {
            // mark current as completed
            roadmap.weeklyContent[weekIndex].status = 'completed';

            // automatically unlock next week if it exists
            if (weekIndex + 1 < roadmap.weeklyContent.length) {
                roadmap.weeklyContent[weekIndex + 1].status = 'ongoing';
            }
        } else if (status === 'ongoing') {
            // Can only mark as ongoing if previous week is completed (or it's the first week)
            if (weekIndex > 0 && roadmap.weeklyContent[weekIndex - 1].status !== 'completed') {
                return res.status(400).json({
                    success: false,
                    message: `You must complete Week ${weekIndex} before starting Week ${weekIndex + 1}`
                });
            }
            roadmap.weeklyContent[weekIndex].status = 'ongoing';
        } else {
            // fallback for other statuses (e.g. reverting to not-started)
            roadmap.weeklyContent[weekIndex].status = status;
        }

        // Calculate overall progress
        const completedWeeks = roadmap.weeklyContent.filter(w => w.status === 'completed').length;
        roadmap.overallProgress = Math.round((completedWeeks / roadmap.totalWeeks) * 100);

        await roadmap.save();

        res.json({ success: true, message: 'Status updated', progress: roadmap.overallProgress, roadmap });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Generate/Get Weekly Assessment
router.post('/:id/week/:weekNumber/assessment', authMiddleware, async (req, res) => {
    try {
        const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.userId });
        if (!roadmap) {
            return res.status(404).json({ success: false, message: 'Roadmap not found' });
        }

        const weekIndex = roadmap.weeklyContent.findIndex(w => w.weekNumber == req.params.weekNumber);
        if (weekIndex === -1) {
            return res.status(404).json({ success: false, message: 'Week not found' });
        }

        const weekContent = roadmap.weeklyContent[weekIndex];

        // Check if assessment already exists
        if (weekContent.assessmentId) {
            const existingAssessment = await Assessment.findById(weekContent.assessmentId);
            return res.json({ success: true, assessment: existingAssessment });
        }

        // Generate new assessment
        const assessmentData = await generateWeeklyAssessment(weekContent.topics, weekContent.weekNumber);

        const assessment = new Assessment({
            roadmapId: roadmap._id,
            weekNumber: weekContent.weekNumber,
            ...assessmentData
        });

        await assessment.save();

        // Link to roadmap
        weekContent.assessmentId = assessment._id;
        await roadmap.save();

        res.json({ success: true, assessment });

    } catch (error) {
        console.error(error);

        // Handle quota exceeded errors
        if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('429')) {
            return res.status(429).json({
                success: false,
                message: 'AI service quota exceeded. Please try again later.',
                error: 'QUOTA_EXCEEDED'
            });
        }

        res.status(500).json({ success: false, message: 'Failed to generate assessment' });
    }
});

// Generate/Get Master Assessment
router.post('/:id/master-assessment', authMiddleware, async (req, res) => {
    try {
        const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.userId });
        if (!roadmap) {
            return res.status(404).json({ success: false, message: 'Roadmap not found' });
        }

        // Check if exists
        if (roadmap.masterAssessmentId) {
            const existingAssessment = await Assessment.findById(roadmap.masterAssessmentId);
            return res.json({ success: true, assessment: existingAssessment });
        }

        // Collect all topics
        const allTopics = roadmap.weeklyContent.reduce((acc, week) => [...acc, ...week.topics], []);

        // Generate master assessment
        const assessmentData = await generateMasterAssessment(allTopics, roadmap.subjectName);

        const assessment = new Assessment({
            roadmapId: roadmap._id,
            isMasterAssessment: true,
            ...assessmentData
        });

        await assessment.save();

        roadmap.masterAssessmentId = assessment._id;
        await roadmap.save();

        res.json({ success: true, assessment });

    } catch (error) {
        console.error(error);

        // Handle quota exceeded errors
        if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('429')) {
            return res.status(429).json({
                success: false,
                message: 'AI service quota exceeded. Please try again later.',
                error: 'QUOTA_EXCEEDED'
            });
        }

        res.status(500).json({ success: false, message: 'Failed to generate master assessment' });
    }
});

module.exports = router;
