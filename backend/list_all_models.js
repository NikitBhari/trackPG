const https = require('https');
const dotenv = require('dotenv');
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            if (response.models) {
                console.log("=== AVAILABLE MODELS ===");
                const visionModels = response.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
                visionModels.forEach(m => {
                    console.log(`Name: ${m.name}`);
                    console.log(`Methods: ${m.supportedGenerationMethods.join(', ')}`);
                    console.log('---');
                });
            } else {
                console.log("Error or no models found:", response);
            }
        } catch (e) {
            console.error("Error parsing response:", e);
            console.log("Raw data:", data);
        }
    });

}).on('error', (err) => {
    console.error("Error fetching models:", err);
});
