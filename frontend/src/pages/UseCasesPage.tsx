import { useEffect, useState } from 'react';
import { getUseCases } from '../services/api';
import type { UseCase } from '../types';
import UseCaseCard from '../components/UseCaseCard';

export default function UseCasesPage() {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUseCases = async () => {
      try {
        const response = await getUseCases();
        setUseCases(response.data);
      } catch (error) {
        console.error('Error fetching use cases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUseCases();
  }, []);

  const filteredUseCases = useCases.filter((useCase) =>
    useCase.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    useCase.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    useCase.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500"></div>
      </div>
    );
  }

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

      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{filteredUseCases.length}</span> use cases
        </p>
      </div>

      {filteredUseCases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No use cases found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUseCases.map((useCase) => (
            <UseCaseCard key={useCase.id} useCase={useCase} />
          ))}
        </div>
      )}
    </div>
  );
}
