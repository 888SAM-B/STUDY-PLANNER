const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

function _maskKey(k) {
  if (!k) return null;
  if (k.length <= 10) return '***';
  return `${k.slice(0, 4)}...${k.slice(-4)}`;
}

console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY, 'masked:', _maskKey(process.env.GEMINI_API_KEY));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, { apiVersion: 'v1' });

async function retryOn429(fn, retries = 4, baseDelay = 1000) {
  let attempt = 0;
  let delay = baseDelay;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.response?.status || err?.status;
      if (status === 429 && attempt < retries) {
        await new Promise(r => setTimeout(r, delay));
        attempt += 1;
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
}

/**
 * Generate study roadmap using Gemini AI
 */
async function generateRoadmap(syllabusText, referenceMaterialsText, studyParams) {
  const { dueTime, studyTimePerDay, studyDaysPerWeek } = studyParams;

  // Truncate syllabus if too long (approx 30k characters)
  const truncatedSyllabus = syllabusText.length > 30000 ? syllabusText.substring(0, 30000) + "...(truncated)" : syllabusText;
  const totalWeeks = dueTime.unit === 'months'
    ? Math.ceil(dueTime.value * 4)
    : dueTime.value;

  const prompt = `
    Create a detailed, high-quality study roadmap for the provided syllabus.
    
    Syllabus Context:
    'Python'
    
    ${referenceMaterialsText ? `Reference Materials:\n${referenceMaterialsText}\n` : ''}
    
    Constraints:
    - Duration: ${totalWeeks} weeks
    - Study Intensity: ${studyTimePerDay} hours per day, ${studyDaysPerWeek} days per week.
    
    The plan should be professional and comprehensive. For each week, provide a focused goal, a day-by-day study schedule (Day 1 to ${studyDaysPerWeek}), several detailed topics, and a concise cheat sheet.
    IMPORTANT: The dailyPlan format MUST be strictly "Day 1", "Day 2", etc., up to "Day ${studyDaysPerWeek}".
  `;

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      weeklyPlan: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            weekNumber: { type: SchemaType.NUMBER },
            weekTitle: { type: SchemaType.STRING },
            topics: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING },
                  description: { type: SchemaType.STRING },
                  referenceLink: { type: SchemaType.STRING }
                },
                required: ["title", "description"]
              }
            },
            dailyPlan: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  day: { type: SchemaType.STRING, description: "Format: 'Day X' e.g. 'Day 1'" },
                  topics: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING }
                  }
                },
                required: ["day", "topics"]
              }
            },
            cheatSheet: { type: SchemaType.STRING }
          },
          required: ["weekNumber", "weekTitle", "topics", "dailyPlan", "cheatSheet"]
        }
      }
    },
    required: ["weeklyPlan"]
  };

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const result = await retryOn429(() => model.generateContent(prompt));
    const response = await result.response;
    const text = response.text();
    const roadmapData = JSON.parse(text);

    // Transform rich schema back to flat DB structure
    return roadmapData.weeklyPlan.map(week => ({
      weekNumber: week.weekNumber,
      dailyPlan: week.dailyPlan,
      topics: week.topics.map(t => `${t.title}: ${t.description}`),
      studyMaterials: week.topics
        .filter(t => t.referenceLink)
        .map(t => `${t.title} - ${t.referenceLink}`),
      cheatSheet: `**${week.weekTitle}**\n\n${week.cheatSheet}`
    }));

  } catch (error) {
    console.error('Error generating roadmap:', {
      status: error?.response?.status || error?.status,
      body: error?.response?.data || error?.message || error
    });
    throw error;
  }
}

/**
 * Generate weekly assessment using Gemini AI
 */
async function generateWeeklyAssessment(weekTopics, weekNumber) {
  const prompt = `
You are an expert educator. Create a comprehensive assessment for Week ${weekNumber} covering the following topics:

TOPICS:
${weekTopics.join('\n')}

Please create an assessment with 10 multiple-choice questions in the following JSON format:
{
  "title": "Week ${weekNumber} Assessment",
  "description": "Assessment covering topics from week ${weekNumber}",
  "questions": [
    {
      "questionText": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation of why this is correct",
      "points": 1
    }
  ],
  "totalPoints": 10,
  "timeLimit": 20
}

GUIDELINES:
1. Create exactly 10 questions
2. Questions should test understanding, not just memorization
3. Include a mix of difficulty levels (easy, medium, hard)
4. Provide clear explanations for correct answers
5. Each question is worth 1 point
6. Time limit should be 20 minutes

Return ONLY the JSON object, no additional text.
`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await retryOn429(() => model.generateContent(prompt));
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating assessment:', {
      status: error?.response?.status || error?.status,
      body: error?.response?.data || error?.message || error
    });
    throw error;
  }
}

/**
 * Generate master assessment using Gemini AI
 */
async function generateMasterAssessment(allTopics, subjectName) {
  const prompt = `
You are an expert educator. Create a comprehensive MASTER assessment for the subject "${subjectName}" covering ALL the following topics:

TOPICS:
${allTopics.join('\n')}

Please create a master assessment with 25 multiple-choice questions in the following JSON format:
{
  "title": "${subjectName} - Master Assessment",
  "description": "Comprehensive final assessment covering all topics",
  "questions": [
    {
      "questionText": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation of why this is correct",
      "points": 1
    }
  ],
  "totalPoints": 25,
  "timeLimit": 45
}

GUIDELINES:
1. Create exactly 25 questions covering ALL topics
2. Ensure comprehensive coverage of the entire syllabus
3. Include a mix of difficulty levels with emphasis on medium-hard questions
4. Questions should test deep understanding and application
5. Provide detailed explanations for correct answers
6. Each question is worth 1 point
7. Time limit should be 45 minutes

Return ONLY the JSON object, no additional text.
`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await retryOn429(() => model.generateContent(prompt));
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating master assessment:', {
      status: error?.response?.status || error?.status,
      body: error?.response?.data || error?.message || error
    });
    throw error;
  }
}

module.exports = {
  generateRoadmap,
  generateWeeklyAssessment,
  generateMasterAssessment
};
