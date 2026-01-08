import { useEffect, useState } from 'react';
import { getTutorials } from '../services/api';
import type { Tutorial } from '../types';

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const response = await getTutorials();
        setTutorials(response.data);
      } catch (error) {
        console.error('Error fetching tutorials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorials();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Tutorials</h1>
        <p className="text-lg text-gray-600 mb-6">
          Learn AI concepts and best practices through video tutorials
        </p>
      </div>

      {tutorials.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tutorials available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((tutorial) => (
            <div key={tutorial.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-200">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{tutorial.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{tutorial.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                    </svg>
                    {tutorial.duration}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(tutorial.uploaded_date).toLocaleDateString()}
                  </span>
                </div>

                <a
                  href={tutorial.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Watch Tutorial
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
