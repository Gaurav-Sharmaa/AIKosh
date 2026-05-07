import { useEffect, useState } from 'react';
import { getModels } from '../services/api';
import type { Model } from '../types';
import ModelCard from '../components/ModelCard';

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await getModels(searchTerm || undefined);
        setModels(response.data);
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Models</h1>
        <p className="text-lg text-gray-600 mb-6">
          Discover models to support your AI solutions
        </p>
        <div className="max-w-2xl">
          <input
            type="text"
            placeholder="Search models by name, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{models.length}</span> models
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500" />
        </div>
      ) : models.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No models found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      )}
    </div>
  );
}