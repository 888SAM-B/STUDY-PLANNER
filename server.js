const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const roadmapRoutes = require('./routes/roadmap');
const assessmentRoutes = require('./routes/assessment');

app.use('/api/auth', authRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/assessment', assessmentRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((error) => {
    console.log("MongoDB Connection Error:", error);
});

app.get("/", (req, res) => {
    res.send("DYC Study Planner API is Running");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Multer errors
    if (err instanceof require('multer').MulterError) {
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
