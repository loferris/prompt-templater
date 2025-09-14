'use client';

import { useState, useEffect } from 'react';
import { ParsedTemplate } from '@/src/lib/types';

export default function Home() {
  const [templates, setTemplates] = useState<ParsedTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ParsedTemplate | null>(null);
  const [promptValues, setPromptValues] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/templates');
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        const data = await response.json();
        setTemplates(data.templates);
        if (data.templates.length > 0) {
          setSelectedTemplate(data.templates[0]);
        }
      } catch (err: any) {
        setError(err.message);
      }
    }
    fetchData();
  }, []);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const template = templates.find((t) => t.id.toString() === e.target.value) || null;
    setSelectedTemplate(template);
    setPromptValues({});
    setGeneratedPrompt('');
    setError(null);
  };

  const handleValueChange = (variable: string, value: string) => {
    setPromptValues((prev) => ({ ...prev, [variable]: value }));
  };

  const generate = async () => {
    if (!selectedTemplate) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_prompt: selectedTemplate.base_prompt,
          promptValues,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      const data = await response.json();
      setGeneratedPrompt(data.enhancedPrompt);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Prompt Builder</h1>

      <div className="mb-4">
        <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 mb-1">Select a Template</label>
        <select
          id="template-select"
          value={selectedTemplate ? selectedTemplate.id : ''}
          onChange={handleTemplateChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">-- Choose a template --</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTemplate && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Fill in the variables:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {selectedTemplate.variables.map((variable) => (
              <div key={variable}>
                <label htmlFor={variable} className="block text-sm font-medium text-gray-700">{variable}</label>
                <input
                  type="text"
                  id={variable}
                  value={promptValues[variable] || ''}
                  onChange={(e) => handleValueChange(variable, e.target.value)}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            ))}
          </div>

          <button
            onClick={generate}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
          >
            {isLoading ? 'Generating...' : 'Generate Prompt'}
          </button>

          {error && (
            <div className="mt-4 text-red-500">
              <p>Error: {error}</p>
            </div>
          )}

          {generatedPrompt && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Generated Prompt:</h3>
              <textarea
                readOnly
                value={generatedPrompt}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                rows={10}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}