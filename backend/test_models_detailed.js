const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

async function testModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-pro-vision",
        "gemini-1.0-pro-vision-latest"
    ];

    console.log("Testing models for image generation (multimodal)...");

    for (const modelName of models) {
        try {
            console.log(`\n--- Testing ${modelName} ---`);
            const model = genAI.getGenerativeModel({ model: modelName });
            // Note: We are just testing text generation here to check model existence/access.
            // Multimodal models usually support text-only prompts too, or we'd need a dummy image.
            // Let's try a simple text prompt first.
            const result = await model.generateContent("Hello");
            console.log(`✅ SUCCESS: ${modelName} responded.`);
        } catch (error) {
            console.log(`❌ FAILED: ${modelName}`);
            console.log(`   Error: ${error.message.split('\n')[0]}`);
        }
    }
}

testModels();
