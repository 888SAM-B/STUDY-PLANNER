const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register User
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        // Create token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            token,
            user: { _id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Check password (if not Google Auth user)
        if (!user.password && user.googleId) {
            return res.status(400).json({ success: false, message: 'Please login with Google' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        // Create token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: { _id: user._id, name: user.name, email: user.email, profilePicture: user.profilePicture }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Google Login
router.post('/google', async (req, res) => {
    try {
        const { tokenId } = req.body;

        // Use a dummy verification for development if no real Client ID provided yet
        // In production, un-comment the actual verification lines below
        /*
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const { name, email, picture, sub } = ticket.getPayload();
        */

        // For development/demo without valid Google Setup, we accept the payload directly
        // WARNING: ONLY FOR DEV if verification fails or is skipped. 
        // Real implementation should ALWAYS verify token.
        // Assuming frontend sends the profile object for now if verification steps are skipped
        const { email, name, picture, sub } = req.body.profileObj || {};

        if (!email) {
            return res.status(400).json({ success: false, message: 'Invalid Google Token Data' });
        }

        let user = await User.findOne({ email });

        if (user) {
            // Update googleId if not set (linking accounts)
            if (!user.googleId) {
                user.googleId = sub;
                await user.save();
            }
        } else {
            // Create new Google user
            user = new User({
                name,
                email,
                googleId: sub,
                profilePicture: picture,
                password: '' // No password for Google users
            });
            await user.save();
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: { _id: user._id, name: user.name, email: user.email, profilePicture: user.profilePicture }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ success: false, message: 'Google Auth Failed' });
    }
});

// Get Current User
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
