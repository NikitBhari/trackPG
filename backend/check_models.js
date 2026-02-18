const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

async function checkModels() {
    console.log("Starting model check...");
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Test specific models including the one we want to use
        const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

        for (const modelName of modelsToTest) {
            console.log(`Testing model: ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello, are you there?");
                const response = await result.response;
                console.log(`✅ ${modelName} is WORKING. Response: ${response.text().substring(0, 50)}...`);
            } catch (error) {
                console.error(`❌ ${modelName} FAILED: ${error.message}`);
            }
        }
    } catch (err) {
        console.error("Fatal error in script:", err);
    }
}

checkModels().catch(console.error);
