//server.js
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const cors = require('cors');

// Middleware Setup
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Check .env Variables
const { MONGO_URI, EMAIL_USER, EMAIL_PASS } = process.env;
if (!MONGO_URI || !EMAIL_USER || !EMAIL_PASS) {
    console.error('Missing required environment variables. Check your .env file.');
    process.exit(1);
}

// MongoDB Connection (Singleton)
let db;
const connectToDatabase = async () => {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db("Bursary_Application"); // Replace with your database name
};
connectToDatabase().catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
});

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Route: Form Submission
app.post('/submit', upload.array('upload[]'), async (req, res) => {
    try {
        console.log('Form Data:', req.body);
        console.log('Uploaded Files:', req.files);

        const { name, surname, id_number, 'home-Address': homeAddress, Suburb, City, Province, 'Postal-Code': postalCode, ward, number, email, education, qualification, university } = req.body;

        // Validation
        if (!email || !name) {
            return res.status(400).json({ message: 'Missing required form data' });
        }
        if (req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        // Prepare Submission Object
        const submission = {
            name,
            surname,
            id_number,
            homeAddress,
            Suburb,
            City,
            Province,
            postalCode,
            ward,
            number,
            email,
            education,
            qualification,
            university,
            files: req.files.map(file => ({
                filename: file.filename,
                path: file.path,
            })),
            submittedAt: new Date(),
        };

        // Insert Submission into MongoDB
        const collection = db.collection("myBursary_Application");
        const result = await collection.insertOne(submission);
        console.log('Submission stored in MongoDB with ID:', result.insertedId);

        // Respond to the client immediately
        res.status(200).json({ 
            message: 'Application submitted successfully. Email is being processed.',
            submissionId: result.insertedId
        });

        // Send Confirmation Email (Async)
        //in future we will use SendGrid for better email scalability.
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: EMAIL_USER,
            to: email,
            subject: 'Application Received',
            text: `Dear ${name} ${surname},\n\nThank you for submitting your application. We have received your details and will review them.\n\nBest regards,\nMayoral Bursary Team`,
        };

        transporter.sendMail(mailOptions)
            .then(info => console.log('Email sent:', info.response))
            .catch(error => console.error('Error sending email:', error.message));

    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({ message: 'Unexpected error occurred: ' + err.message });
    }
});

// Route: File Download
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
