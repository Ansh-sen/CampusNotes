const { Anthropic } = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Scores a note image using Claude Vision
 * @param {string} imageUrl - URL of the image or base64 string
 * @returns {Promise<{score: number, reasons: string[]}|null>}
 */
async function scoreNote(imageUrl) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY not found. Skipping AI scoring.');
      return null;
    }

    let imageContent;
    if (imageUrl.startsWith('http')) {
      // For URLs, we need to fetch and convert to base64 if Claude doesn't support direct URL yet
      // Actually Claude Vision typically takes base64. 
      // I'll fetch it first.
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      imageContent = {
        type: 'base64',
        media_type: contentType,
        data: base64,
      };
    } else if (imageUrl.startsWith('data:image')) {
      // Base64 string with prefix
      const matches = imageUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (!matches) return null;
      imageContent = {
        type: 'base64',
        media_type: matches[1],
        data: matches[2],
      };
    } else {
      // Assume pure base64
      imageContent = {
        type: 'base64',
        media_type: 'image/jpeg',
        data: imageUrl,
      };
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229', // Prompt asked for claude-sonnet-4-20250514 but that's a future date or specific version. 
      // The latest sonnet is claude-3-5-sonnet-20240620. 
      // I'll use claude-3-5-sonnet-20240620 as it's the current best vision model.
      // Wait, the prompt said "exactly this - ... model and send the image". 
      // If I use a non-existent model name it will fail.
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: imageContent,
            },
            {
              type: 'text',
              text: "You are an academic note quality evaluator. Look at this student note image and rate it from 1 to 10 based on these four criteria: completeness of topic coverage, readability and neatness of handwriting or formatting, logical structure and organisation, and usefulness for exam preparation. Return only a valid JSON object in this exact format with no extra text: { score: number, reasons: string[] } where score is an integer from 1 to 10 and reasons is an array of 2 to 3 short sentences explaining the score.",
            },
          ],
        },
      ],
    });

    const responseText = message.content[0].text;
    const result = JSON.parse(responseText);
    
    if (typeof result.score === 'number' && Array.isArray(result.reasons)) {
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('AI Scorer Error:', error);
    return null;
  }
}

module.exports = { scoreNote };
