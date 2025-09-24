'use client';

import { useState, useEffect } from 'react';
import { ParsedTemplate, Platform } from '@/src/lib/types';

// Mock platforms data - in a real app this would come from an API
const PLATFORMS: Platform[] = [
  { id: 1, name: 'midjourney', description: 'Discord-based AI image generator' },
  { id: 2, name: 'stable_diffusion', description: 'Open source diffusion model' },
  { id: 3, name: 'flux', description: 'High-quality image generation' }
];

interface EnhanceResult {
  enhancedPrompt: string;
  originalPrompt: string;
  platform: string;
}

export default function PromptBuilderPage() {
  const [templates, setTemplates] = useState<ParsedTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ParsedTemplate | null>(null);
  const [mode, setMode] = useState<'basic' | 'advanced'>('basic');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform['name']>('midjourney');
  const [naturalLanguagePrompt, setNaturalLanguagePrompt] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnhanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    async function loadTemplates() {
      try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        setTemplates(data.templates || []);
        if (data.templates?.length > 0) {
          handleTemplateSelect(data.templates[0]);
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
        setError('Failed to load templates');
      }
    }
    loadTemplates();
  }, []);

  const handleTemplateSelect = (template: ParsedTemplate) => {
    setSelectedTemplate(template);
    setResult(null);
    setError(null);
    
    // Auto-fill with example values in basic mode
    if (mode === 'basic') {
      const exampleValues = parseExampleValues(template.example_values);
      setVariableValues(exampleValues);
    } else {
      // Clear values in advanced mode - let user fill manually
      const emptyValues: Record<string, string> = {};
      template.variables.forEach(variable => {
        emptyValues[variable] = '';
      });
      setVariableValues(emptyValues);
    }
  };

  const handleModeChange = (newMode: 'basic' | 'advanced') => {
    setMode(newMode);
    if (selectedTemplate) {
      handleTemplateSelect(selectedTemplate); // Refill values based on mode
    }
  };

  const parseExampleValues = (exampleString: string): Record<string, string> => {
    const values: Record<string, string> = {};
    const pairs = exampleString.split(',').map(pair => pair.trim());
    
    for (const pair of pairs) {
      const [key, ...valueParts] = pair.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        values[key.trim()] = value;
      }
    }
    return values;
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        base_prompt: selectedTemplate.base_prompt,
        promptValues: variableValues,
        platform: selectedPlatform,
        platformParams: selectedTemplate.platformParams,
        ...(mode === 'basic' && naturalLanguagePrompt && {
          naturalLanguagePrompt: naturalLanguagePrompt
        })
      };

      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setError(error.message || 'Failed to generate prompt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Prompt Builder
          </h1>
          <p className="text-lg text-gray-600">
            Create enhanced prompts for AI image generation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">Build Your Prompt</h2>
            
            {/* Template Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Template
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const template = templates.find(t => t.id === e.target.value);
                  if (template) handleTemplateSelect(template);
                }}
              >
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.category}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <p className="text-sm text-gray-600 mt-2">
                  {selectedTemplate.description}
                </p>
              )}
            </div>

            {/* Mode Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode
              </label>
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    mode === 'basic' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => handleModeChange('basic')}
                >
                  Basic
                </button>
                <button
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    mode === 'advanced'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => handleModeChange('advanced')}
                >
                  Advanced
                </button>
              </div>
            </div>

            {/* Natural Language Input (Basic Mode) */}
            {mode === 'basic' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe what you want (optional)
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  rows={3}
                  placeholder="e.g., Make it epic and dramatic with moody lighting..."
                  value={naturalLanguagePrompt}
                  onChange={(e) => setNaturalLanguagePrompt(e.target.value)}
                />
              </div>
            )}

            {/* Variable Inputs */}
            {selectedTemplate && selectedTemplate.variables.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {mode === 'basic' ? 'Template Variables (auto-filled)' : 'Fill in Variables'}
                </label>
                <div className="space-y-3">
                  {selectedTemplate.variables.map(variable => (
                    <div key={variable}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {variable}
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 disabled:bg-gray-100 disabled:text-gray-600"
                        placeholder={`Enter ${variable}...`}
                        value={variableValues[variable] || ''}
                        onChange={(e) => setVariableValues(prev => ({
                          ...prev,
                          [variable]: e.target.value
                        }))}
                        disabled={mode === 'basic'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Platform Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Platform (Choose One)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {PLATFORMS.map(platform => (
                  <button
                    key={platform.id}
                    className={`p-3 text-left border rounded-md transition-colors ${
                      selectedPlatform === platform.name
                        ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-200'
                        : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                    onClick={() => setSelectedPlatform(platform.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium capitalize">{platform.name.replace('_', ' ')}</div>
                        <div className="text-sm text-gray-600">{platform.description}</div>
                      </div>
                      {selectedPlatform === platform.name && (
                        <div className="text-blue-500">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Platform-specific parameters will be automatically added to your enhanced prompt.
              </p>
            </div>

            {/* Generate Button */}
            <button
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleGenerate}
              disabled={loading || !selectedTemplate}
            >
              {loading ? 'Generating...' : 'Generate Enhanced Prompt'}
            </button>
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">Generated Prompt</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}

            {result ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enhanced Prompt for {result.platform.charAt(0).toUpperCase() + result.platform.slice(1).replace('_', ' ')}
                  </label>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <p className="text-sm leading-relaxed text-gray-900">{result.enhancedPrompt}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <button
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => navigator.clipboard.writeText(result.enhancedPrompt)}
                    >
                      📋 Copy to clipboard
                    </button>
                    {(result.enhancedPrompt.includes('--') || result.enhancedPrompt.includes('{')) && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        ✓ Platform parameters included
                      </span>
                    )}
                  </div>
                </div>

                {result.originalPrompt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Combined Prompt
                    </label>
                    <div className="bg-gray-50 p-4 rounded-md border">
                      <p className="text-sm leading-relaxed text-gray-700">{result.originalPrompt}</p>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Tip:</strong> Try templates like "Fantasy Animal", "Cyberpunk Portrait", or "Epic Fantasy Landscape" to see platform parameters in action!
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <div className="text-4xl mb-4">🎨</div>
                <p>Select a template and click "Generate" to see your enhanced prompt here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}