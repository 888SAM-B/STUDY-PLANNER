const mongoose = require('mongoose');

const weeklyContentSchema = new mongoose.Schema({
    weekNumber: {
        type: Number,
        required: true
    },
    topics: [{
        type: String
    }],
    studyMaterials: [{
        type: String
    }],
    cheatSheet: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['not-started', 'ongoing', 'completed'],
        default: 'not-started'
    },
    assessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment'
    },
    assessmentCompleted: {
        type: Boolean,
        default: false
    },
    assessmentScore: {
        type: Number,
        default: null
    }
});

const roadmapSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subjectName: {
        type: String,
        required: true,
        trim: true
    },
    syllabusInput: {
        type: String,
        enum: ['file', 'text'],
        default: 'file'
    },
    syllabusTextContent: {
        type: String
    },
    syllabusFile: {
        fileName: String,
        filePath: String,
        fileType: String
    },
    referenceMaterials: [{
        fileName: String,
        filePath: String,
        fileType: String
    }],
    dueTime: {
        value: Number,
        unit: {
            type: String,
            enum: ['weeks', 'months']
        }
    },
    studyTimePerDay: {
        type: Number, // in hours
        required: true
    },
    studyDaysPerWeek: {
        type: Number,
        required: true,
        min: 1,
        max: 7
    },
    totalWeeks: {
        type: Number,
        required: true
    },
    weeklyContent: [weeklyContentSchema],
    masterAssessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment'
    },
    masterAssessmentCompleted: {
        type: Boolean,
        default: false
    },
    masterAssessmentScore: {
        type: Number,
        default: null
    },
    overallProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
roadmapSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Roadmap', roadmapSchema);
