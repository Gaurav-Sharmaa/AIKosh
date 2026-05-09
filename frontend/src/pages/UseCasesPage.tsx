import { useEffect, useState } from 'react';
import { getUseCases } from '../services/api';
import type { UseCase } from '../types';
import UseCaseCard from '../components/UseCaseCard';

export default function UseCasesPage() {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await getUseCases(searchTerm || undefined);
        setUseCases(response.data);
      } catch (error) {
        console.error('Error fetching use cases:', error);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Use Cases</h1>
        <p className="text-lg text-gray-600 mb-6">
          Access use case library to inspire your next AI innovation
        </p>
        <div className="max-w-2xl">
          <input
            type="text"
            placeholder="Search use cases by name, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{useCases.length}</span> use cases
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-500" />
        </div>
      ) : useCases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No use cases found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase) => (
            <UseCaseCard key={useCase.id} useCase={useCase} />
          ))}
        </div>
      )}
    </div>
  );
}