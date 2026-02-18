const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup for handling file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Gemini API Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to convert buffer to Gemini compatible format
function fileToGenerativePart(buffer, mimeType) {
    return {
        inlineData: {
            data: buffer.toString('base64'),
            mimeType
        },
    };
}

app.post('/analyze-food', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
        });

        const prompt = `
        Imagine yourself as a world-class Health Professional and Nutritionist. 
        Analyze the food in this image and provide:
        1. Estimated nutritional content: Calories, Carbs, Protein, Fat, Vitamins, and Minerals.
        2. A brief health coach-style suggestion or feedback for the user based on this meal.
        
        Return the data strictly matching this JSON schema:
        {
          "nutrition": {
            "calories": "Estimated value",
            "carbs": "Estimated value",
            "protein": "Estimated value",
            "fat": "Estimated value",
            "vitamins": ["Vitamin A", "Vitamin C"],
            "minerals": ["Iron", "Calcium"]
          },
          "health_coach_feedback": "Your professional advice here."
        }
        `;

        // Create the image part
        const imagePart = fileToGenerativePart(req.file.buffer, req.file.mimetype);

        // Generate content
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        console.log("Gemini Raw Response:", text);

        // Since we enforced responseMimeType: "application/json", we can parse directly
        let jsonResponse;
        try {
            jsonResponse = JSON.parse(text);
        } catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            jsonResponse = {
                error: "Failed to parse AI response",
                raw_text: text
            };
        }

        res.json(jsonResponse);

    } catch (error) {
        console.error('Error analyzing food:', error);
        res.status(500).json({ error: 'Failed to analyze food image', details: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('TrackPG Backend with Gemini API is running!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});