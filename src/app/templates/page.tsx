
import { loadTemplateData } from '@/src/lib/data-loader';

export default async function TemplatesPage() {
  const { templates } = await loadTemplateData();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Prompt Templates</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div key={template.id} className="border p-4 rounded-lg">
            <h2 className="text-xl font-semibold">{template.name}</h2>
            <p className="text-gray-600">{template.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
