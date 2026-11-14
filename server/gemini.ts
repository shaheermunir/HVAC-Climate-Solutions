import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function askGeminiHvacAssistant(
  userMessage: string,
  history: Array<{ role: 'user' | 'model'; text: string }> = []
): Promise<string> {
  const ai = getAiClient();
  if (!ai) {
    // Graceful offline fallback
    return (
      "I am your Virtual Climate Assistant. Currently, our AI direct link is awaiting API key configuration in settings, but our live team is standing by! For 24/7 emergency dispatch, please call our emergency line or use our instant online booking button above."
    );
  }

  const systemInstruction = `You are the Virtual Climate Consultant for Airflow Climate Solutions, a licensed, certified professional HVAC contractor.
You assist homeowners and commercial facility managers with:
1. Explaining heating and cooling symptoms (e.g. AC freezing up, warm air blowing, short-cycling, furnace ignition failures, heat pump auxiliary heat, loud noises, high energy bills).
2. Guiding customers to the appropriate service category (AC Repair, Precision Tune-Up, Heat Pump Replacement, Duct Sealing, Smart Thermostats, Commercial RTUs).
3. Calculating approximate cooling requirements (rule of thumb: ~500-600 sq ft per ton, with ACCA Manual J load calculation required for exact sizing).
4. Outlining available incentives (up to $2,000 Federal 25C Tax Credits for high-efficiency heat pumps).

CRITICAL SAFETY RULES:
- NEVER provide instructions for users to handle high-voltage electrical components (capacitors, contactors, disconnect boxes), open refrigerant circuits, or tamper with gas furnace valves/heat exchangers.
- Always warn that DIY refrigerant or electrical work voids warranties and carries risk of fire, electrocution, or severe chemical burns.
- Advise users experiencing burning smells, sparks, or suspected gas leaks to turn off power/gas immediately and evacuate or call our 24/7 emergency line.
- Conclude helpful answers with an invitation to book an appointment online or request an estimate. Keep responses concise, clear, and reassuring.`;

  try {
    // Format conversation history for multi-turn chat if provided
    const contents: any[] = [];
    for (const msg of history) {
      contents.push({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
      },
    });

    return response.text || 'I am ready to help with any heating, cooling, or air quality questions. How can Airflow Climate Solutions assist you today?';
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    return (
      'Our diagnostic assistant is temporarily reconnecting. For urgent cooling or heating needs, please call our 24/7 live dispatch team or book directly through our website.'
    );
  }
}
