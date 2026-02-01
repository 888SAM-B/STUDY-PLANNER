const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true
    },
    options: [{
        type: String
    }],
    correctAnswer: {
        type: String,
        required: true
    },
    explanation: {
        type: String,
        default: ''
    },
    points: {
        type: Number,
        default: 1
    }
});

const assessmentSchema = new mongoose.Schema({
    roadmapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Roadmap',
        required: true
    },
    weekNumber: {
        type: Number,
        // null for master assessment
        default: null
    },
    isMasterAssessment: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    questions: [questionSchema],
    totalPoints: {
        type: Number,
        required: true
    },
    passingScore: {
        type: Number,
        default: 60 // percentage
    },
    timeLimit: {
        type: Number, // in minutes
        default: 30
    },
    attempts: [{
        attemptDate: {
            type: Date,
            default: Date.now
        },
        score: Number,
        answers: [{
            questionId: mongoose.Schema.Types.ObjectId,
            selectedAnswer: String,
            isCorrect: Boolean
        }],
        timeTaken: Number // in minutes
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Assessment', assessmentSchema);
