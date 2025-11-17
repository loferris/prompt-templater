import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier } from '@/src/lib/rate-limiter';
import { sanitizePromptInput } from '@/src/lib/validation';
import { validateRequest } from '@/src/lib/server-session';

const MAX_PROMPT_LENGTH = 2000;
const MAX_REQUESTS_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

interface EnhanceRequestBody {
  base_prompt: string;
  promptValues: Record<string, string>;
  platform?: string;
  platformParams?: any;
  naturalLanguagePrompt?: string;
}

// Enhanced LLM client with system prompt support and error handling
async function callLlmWithSystem(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';

  try {
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
        max_tokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || '2000'),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = 'AI service error';

      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        errorMessage = errorBody || errorMessage;
      }

      if (response.status === 401) {
        throw new Error('Invalid API key. Please log in again with a valid API key.');
      } else if (response.status === 429) {
        throw new Error('AI service rate limit exceeded. Please try again in a moment.');
      } else if (response.status >= 500) {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      }

      throw new Error(`AI service error: ${errorMessage}`);
    }

    const json = await response.json();

    if (!json.choices || !json.choices[0] || !json.choices[0].message) {
      throw new Error('Invalid response from AI service');
    }

    return json.choices[0].message.content;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to communicate with AI service');
  }
}

export async function POST(req: NextRequest) {
  try {
    // Validate API key from request
    const validation = validateRequest(req);
    if (!validation.valid || !validation.apiKey) {
      return NextResponse.json(
        { error: 'Authentication required', message: validation.error || 'Please log in' },
        { status: 401 }
      );
    }

    const userApiKey = validation.apiKey;

    // Rate limiting
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(clientId, {
      maxRequests: MAX_REQUESTS_PER_MINUTE,
      windowMs: RATE_LIMIT_WINDOW,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          },
        }
      );
    }

    // Parse and validate request body
    let body: EnhanceRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    const { base_prompt, promptValues, platform, platformParams, naturalLanguagePrompt } = body;

    // Validate required fields
    if (!base_prompt || typeof base_prompt !== 'string') {
      return NextResponse.json(
        { error: 'Validation error', message: 'base_prompt is required and must be a string' },
        { status: 400 }
      );
    }

    if (!promptValues || typeof promptValues !== 'object') {
      return NextResponse.json(
        { error: 'Validation error', message: 'promptValues is required and must be an object' },
        { status: 400 }
      );
    }

    // Validate prompt length
    if (base_prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: `Base prompt is too long. Maximum length is ${MAX_PROMPT_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedBasePrompt = sanitizePromptInput(base_prompt);
    const sanitizedNaturalLanguage = naturalLanguagePrompt
      ? sanitizePromptInput(naturalLanguagePrompt)
      : undefined;

    // Validate and sanitize prompt values
    const sanitizedValues: Record<string, string> = {};
    for (const [key, value] of Object.entries(promptValues)) {
      if (typeof value !== 'string') {
        return NextResponse.json(
          { error: 'Validation error', message: `Value for "${key}" must be a string` },
          { status: 400 }
        );
      }
      sanitizedValues[key] = sanitizePromptInput(value);
    }

    // Substitute variables in base prompt
    let filledPrompt = sanitizedBasePrompt;
    for (const key in sanitizedValues) {
      filledPrompt = filledPrompt.replace(
        new RegExp(`\\[${key}\\]`, 'g'),
        sanitizedValues[key]
      );
    }

    // Combine with natural language prompt if provided
    const combinedPrompt = sanitizedNaturalLanguage
      ? `${sanitizedNaturalLanguage}, ${filledPrompt}`
      : filledPrompt;

    // Validate final prompt length
    if (combinedPrompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Combined prompt is too long. Please use shorter values or descriptions.',
        },
        { status: 400 }
      );
    }

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

    // Call the LLM with user's API key
    const enhancedPrompt = await callLlmWithSystem(userApiKey, systemPrompt, userPrompt);

    // Apply platform parameters
    const finalPrompt = applyPlatformParameters(enhancedPrompt, platform, platformParams);

    return NextResponse.json(
      {
        enhancedPrompt: finalPrompt,
        originalPrompt: combinedPrompt,
        platform: platform || 'none',
      },
      {
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
        },
      }
    );
  } catch (error) {
    console.error('Error in enhance API:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const isUserError = errorMessage.includes('API key') ||
                        errorMessage.includes('rate limit') ||
                        errorMessage.includes('log in');

    return NextResponse.json(
      {
        error: isUserError ? 'Authentication error' : 'Internal server error',
        message: errorMessage,
      },
      { status: isUserError ? 401 : 500 }
    );
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
