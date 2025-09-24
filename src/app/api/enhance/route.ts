import { NextRequest, NextResponse } from 'next/server';

// Enhanced LLM client with system prompt support
async function callLlmWithSystem(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorBody}`);
  }

  const json = await response.json();
  return json.choices[0].message.content;
}

// Legacy function for backward compatibility
async function callLlm(prompt: string): Promise<string> {
  return callLlmWithSystem('You are a helpful assistant.', prompt);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { base_prompt, promptValues, platform, platformParams, naturalLanguagePrompt } = body;

    if (!base_prompt || !promptValues) {
      return NextResponse.json({ error: 'base_prompt and promptValues are required' }, { status: 400 });
    }

    // Substitute variables in base prompt
    let filledPrompt = base_prompt;
    for (const key in promptValues) {
      filledPrompt = filledPrompt.replace(new RegExp(`\\[${key}\\]`, 'g'), promptValues[key]);
    }

    // Combine with natural language prompt if provided
    const combinedPrompt = naturalLanguagePrompt 
      ? `${naturalLanguagePrompt}, ${filledPrompt}`
      : filledPrompt;

    // Create an optimized system prompt for image generation
    const systemPrompt = `You are an expert prompt engineer specializing in AI image generation. Your task is to enhance user prompts to create stunning, detailed images.

Guidelines for enhancement:
- Add specific visual details: lighting, composition, style, mood
- Include technical photography/art terms: depth of field, lighting techniques, camera angles
- Mention artistic styles or references when relevant
- Add quality modifiers: "highly detailed", "8k", "photorealistic", "cinematic"
- Be specific about colors, textures, and atmosphere
- Keep the core concept intact while adding rich descriptive details

Return ONLY the enhanced prompt, no explanations.`;

    const userPrompt = `Enhance this prompt for an AI image generator:\n\n"${combinedPrompt}"`;

    // Call the LLM with system + user prompt
    const enhancedPrompt = await callLlmWithSystem(systemPrompt, userPrompt);

    // Apply platform parameters
    const finalPrompt = applyPlatformParameters(enhancedPrompt, platform, platformParams);

    return NextResponse.json({ 
      enhancedPrompt: finalPrompt,
      originalPrompt: combinedPrompt,
      platform: platform || 'none'
    });

  } catch (error) {
    console.error('Error in enhance API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Apply platform-specific parameters to the enhanced prompt
 */
function applyPlatformParameters(prompt: string, platform?: string, platformParams?: any): string {
  if (!platform || !platformParams) return prompt;

  const params = platformParams[platform];
  if (!params) return prompt;

  // For Midjourney, parameters are strings that get appended
  if (platform === 'midjourney' && typeof params === 'string') {
    return `${prompt} ${params}`;
  }

  // For Stable Diffusion and Flux, parameters are JSON objects
  if (platform === 'stable_diffusion' || platform === 'flux') {
    if (typeof params === 'object') {
      const paramString = Object.entries(params)
        .map(([key, value]) => `--${key} ${value}`)
        .join(' ');
      return `${prompt} ${paramString}`;
    }
  }

  return prompt;
}
