import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUseCaseById } from '../services/api';
import type { UseCase } from '../types';

export default function UseCaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [useCase, setUseCase] = useState<UseCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUseCase = async () => {
      try {
        if (id) {
          const response = await getUseCaseById(parseInt(id));
          setUseCase(response.data);
        }
      } catch (error) {
        console.error('Error fetching use case:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUseCase();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500"></div>
      </div>
    );
  }

  if (!useCase) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Use Case not found</h2>
          <Link to="/usecases" className="text-green-600 hover:text-green-700">
            ← Back to Use Cases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/usecases" className="text-green-600 hover:text-green-700 mb-6 inline-block">
        ← Back to Use Cases
      </Link>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {useCase.image_url && (
          <div className="h-80 bg-gray-100">
            <img
              src={useCase.image_url}
              alt={useCase.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/1200x400?text=Use+Case';
              }}
            />
          </div>
        )}

        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{useCase.title}</h1>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {useCase.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="prose max-w-none mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{useCase.description}</p>
          </div>

          <div className="prose max-w-none mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About Use Case</h2>
            <p className="text-gray-700 whitespace-pre-line">{useCase.about_use_case}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Sector</h3>
              <p className="text-gray-700">{useCase.sector}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Source Organization</h3>
              <p className="text-gray-700">{useCase.source_org}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Explore Use Case
            </button>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
              Bookmark
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
