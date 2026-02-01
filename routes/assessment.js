const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const Roadmap = require('../models/Roadmap');
const authMiddleware = require('../middleware/auth');

// Get Assessment by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }
        res.json({ success: true, assessment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Submit Assessment
router.post('/:id/submit', authMiddleware, async (req, res) => {
    try {
        const { answers, timeTaken } = req.body; // answers: [{ questionId, selectedAnswer }]

        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        // Calculate score
        let score = 0;
        const resultKey = [];

        assessment.questions.forEach(question => {
            const userAnswer = answers.find(a => a.questionId === question._id.toString());
            const isCorrect = userAnswer && userAnswer.selectedAnswer === question.correctAnswer;

            if (isCorrect) {
                score += question.points;
            }

            resultKey.push({
                questionId: question._id,
                selectedAnswer: userAnswer ? userAnswer.selectedAnswer : null,
                isCorrect,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation
            });
        });

        const percentage = (score / assessment.totalPoints) * 100;

        // Save attempt
        assessment.attempts.push({
            score: percentage,
            answers: resultKey.map(r => ({
                questionId: r.questionId,
                selectedAnswer: r.selectedAnswer,
                isCorrect: r.isCorrect
            })),
            timeTaken
        });

        await assessment.save();

        // Update Roadmap with score
        const roadmap = await Roadmap.findById(assessment.roadmapId);
        if (roadmap) {
            if (assessment.isMasterAssessment) {
                roadmap.masterAssessmentCompleted = true;
                roadmap.masterAssessmentScore = percentage;
            } else {
                const weekIndex = roadmap.weeklyContent.findIndex(w => w.weekNumber === assessment.weekNumber);
                if (weekIndex !== -1) {
                    roadmap.weeklyContent[weekIndex].assessmentCompleted = true;
                    roadmap.weeklyContent[weekIndex].assessmentScore = percentage;
                }
            }
            await roadmap.save();
        }

        res.json({
            success: true,
            score: percentage,
            totalPoints: assessment.totalPoints,
            obtainedPoints: score,
            results: resultKey
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
