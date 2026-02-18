const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Note: direct listModels is not always exposed in the high-level helper, 
    // so we try a basic "gemini-pro" connection to verify the key works.
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("✅ API Key is working! 'gemini-pro' responded:", result.response.text());
        console.log("If this works but 'gemini-1.5-flash' fails, it is purely a model name issue.");
    } catch (error) {
        console.error("❌ API Key Error:", error.message);
    }
}

listModels();