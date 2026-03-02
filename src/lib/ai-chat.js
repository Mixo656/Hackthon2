/**
 * AI wellness chat service powered by a4f (OpenAI-compatible API).
 * Uses Gemma 3 27B model for warm, contextual mental wellness conversations.
 */

const API_KEY = 'ddc-a4f-11bf1b03cebb4550a0ef84b5cadcf221';
const BASE_URL = 'https://api.a4f.co/v1';
const MODEL = 'provider-3/gemma-3-27b-it';

/**
 * Call the a4f chat completions API.
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>}
 */
async function callAI(messages) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 256,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`AI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// Fallback responses when API is unavailable
const FALLBACKS = {
  high: "Take a moment to pause. A few deep breaths can help reset your nervous system. Inhale for 4, hold for 4, exhale for 6.",
  medium: "You're doing okay, but some light tension is showing. Consider taking a short break or trying a breathing exercise.",
  low: "You seem centered and calm. Keep up the good work — regular check-ins like this help maintain your wellbeing!",
};

/**
 * Get an AI wellness response for a user message.
 * @param {string} userMessage - The user's message
 * @param {string} stressLevel - 'low' | 'medium' | 'high'
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>}
 */
export async function getAIResponse(userMessage, stressLevel = 'medium', conversationHistory = []) {
  const systemPrompt = `You are Smart Calm AI, a warm and emotionally intelligent mental wellness assistant.
Keep every response to 2–3 sentences maximum. Be calm, grounding, and human.
User's current stress level: ${stressLevel}.
${stressLevel === 'high' ? 'Gently suggest breathing, grounding, or a sensory activity.' : ''}
${stressLevel === 'medium' ? 'Encourage reflection and self-compassion.' : ''}
${stressLevel === 'low' ? 'Reinforce their positive state with encouragement.' : ''}
Never give medical advice. Be supportive and actionable.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6), // keep last 6 messages for context
    { role: 'user', content: userMessage },
  ];

  try {
    return await callAI(messages);
  } catch (err) {
    console.warn('AI API unavailable, using fallback:', err.message);
    return FALLBACKS[stressLevel] || FALLBACKS.medium;
  }
}

/**
 * Get a greeting message from the AI.
 */
export async function getGreeting() {
  try {
    return await callAI([
      { role: 'system', content: 'You are Smart Calm AI, a warm mental wellness assistant. Greet the user in 1 short, friendly sentence. Be inviting and warm.' },
      { role: 'user', content: 'Hi' },
    ]);
  } catch {
    return "Hi there! I'm here to listen. How are you doing right now?";
  }
}

/**
 * Generate a stress analysis suggestion using AI.
 */
export async function getStressSuggestion(variance, motionIntensity, stressLevel) {
  const prompt = `You are a calm mental wellness assistant. A user completed a stress check:
- Rhythm variance: ${variance.toFixed(1)}ms
- Motion intensity: ${motionIntensity.toFixed(0)}%
- Detected stress level: ${stressLevel}
Provide a brief, warm, personalized suggestion (2-3 sentences). Be supportive and actionable.`;

  try {
    return await callAI([
      { role: 'system', content: 'You are Smart Calm AI, a supportive mental wellness assistant. Keep responses to 2-3 sentences.' },
      { role: 'user', content: prompt },
    ]);
  } catch (err) {
    console.warn('AI API unavailable for stress suggestion:', err.message);
    return FALLBACKS[stressLevel] || FALLBACKS.medium;
  }
}

