const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API if a key exists
let genAI = null;
let model = null;

function init() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    return false;
  }
  
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash since it is fast and excellent at coding edits
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    return true;
  } catch (err) {
    console.error('[Gemini] Failed to initialize:', err);
    return false;
  }
}

// System instruction to enforce strict JSON output
const SYSTEM_PROMPT = `
You are SiteForge AI, an expert front-end web developer building a modern, responsive website.
The user will ask you to modify their current HTML, CSS, or JS files.

You must reply with ONLY a valid JSON object. Do NOT include markdown code blocks (\`\`\`json) or any conversational text outside the JSON.
Your JSON must match this structure exactly:
{
  "message": "A friendly 1-2 sentence message describing what you changed.",
  "action": "updateMultipleFiles",
  "payload": {
    "styles.css": "<the completely updated CSS file content>",
    "index.html": "<the completely updated HTML file content>",
    "scripts.js": "<the completely updated JS file content>"
  }
}

CRITICAL RULES:
1. Provide the FULL content for any file you are modifying. Do not use placeholders or omit lines. If you aren't modifying a file, you can omit it from the payload object.
2. Ensure you respond using valid JSON syntax. Escape quotes correctly.
3. Keep the user's design aesthetic modern, clean, and premium.
`;

/**
 * Sends the requested prompt to Gemini along with the user's current project files.
 * @param {string} prompt - The user's chat message
 * @param {Object} currentProject - The current project state, notably files
 * @returns {Promise<Object>} The parsed JSON action object
 */
async function generateCodeEdit(prompt, currentProject) {
  if (!genAI || !model) {
    const initialized = init();
    if (!initialized) {
      throw new Error('Gemini API key is missing or invalid.');
    }
  }

  const { files, category, name } = currentProject;
  
  // Build the context prompt
  const contextMsg = `
PROJECT NAME: ${name || 'Website'}
CATEGORY: ${category || 'general'}
CURRENT FILES:
--- index.html ---
${files?.['index.html'] || ''}
--- styles.css ---
${files?.['styles.css'] || ''}
--- scripts.js ---
${files?.['scripts.js'] || ''}

USER REQUEST:
"${prompt}"

Please respond with the JSON object containing the updated files to accomplish the user's request.
`;

  try {
    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: contextMsg }
    ]);
    const responseText = result.response.text();
    
    // Clean up potential markdown formatting from the LLM
    const cleanJsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(cleanJsonStr);
  } catch (err) {
    console.error('[Gemini] Generation failed:', err);
    throw err;
  }
}

module.exports = { init, generateCodeEdit };
