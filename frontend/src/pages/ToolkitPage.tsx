import { useEffect, useState } from 'react';
import { getToolkit } from '../services/api';
import type { Toolkit } from '../types';
import ToolkitCard from '../components/ToolkitCard';

export default function ToolkitPage() {
  const [toolkit, setToolkit] = useState<Toolkit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchToolkit = async () => {
      try {
        const response = await getToolkit();
        setToolkit(response.data);
      } catch (error) {
        console.error('Error fetching toolkit:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchToolkit();
  }, []);

  const filteredToolkit = toolkit.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.overview.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Toolkit</h1>
        <p className="text-lg text-gray-600 mb-6">
          Explore tools and resources for AI development
        </p>

        <div className="max-w-2xl">
          <input
            type="text"
            placeholder="Search toolkit by name, description, or overview..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{filteredToolkit.length}</span> toolkit items
        </p>
      </div>

      {filteredToolkit.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No toolkit items found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredToolkit.map((item) => (
            <ToolkitCard key={item.id} toolkit={item} />
          ))}
        </div>
      )}
    </div>
  );
}
