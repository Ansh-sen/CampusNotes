const { Anthropic } = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Suggests tags for a listing using Claude
 */
async function suggestTags({ subject_name, material_type, programme, branch, semester }) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) return null;

    const prompt = `Given a student note listing for subject ${subject_name} of type ${material_type} for ${programme} ${branch} semester ${semester}, suggest 5 to 8 specific academic topic tags that buyers would search for. Return only a JSON array of short tag strings, no other text.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].text;
    // Extract array from text if Claude adds markdown
    const jsonMatch = responseText.match(/\[.*\]/s);
    if (!jsonMatch) return null;
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('AI Tag Suggester Error:', error);
    return null;
  }
}

module.exports = { suggestTags };
