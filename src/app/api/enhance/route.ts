import { NextRequest, NextResponse } from 'next/server';

// This will be replaced with a proper LLM client later
async function callLlm(prompt: string): Promise<string> {
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
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorBody}`);
  }

  const json = await response.json();
  return json.choices[0].message.content;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { base_prompt, promptValues } = body;

    if (!base_prompt || !promptValues) {
      return NextResponse.json({ error: 'base_prompt and promptValues are required' }, { status: 400 });
    }

    // Substitute variables
    let prompt = base_prompt;
    for (const key in promptValues) {
      prompt = prompt.replace(`[${key}]`, promptValues[key]);
    }

    // Create a meta-prompt for the LLM
    const metaPrompt = `Enhance the following user prompt for an AI image generator. Return only the enhanced prompt, without any additional text or explanation.\n\nUser prompt: "${prompt}"`;

    // Call the LLM
    const enhancedPrompt = await callLlm(metaPrompt);

    return NextResponse.json({ enhancedPrompt });

  } catch (error) {
    console.error('Error in enhance API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
