import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getToolkitById } from '../services/api';
import type { Toolkit } from '../types';

export default function ToolkitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [toolkit, setToolkit] = useState<Toolkit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToolkit = async () => {
      try {
        if (id) {
          const response = await getToolkitById(parseInt(id));
          setToolkit(response.data);
        }
      } catch (error) {
        console.error('Error fetching toolkit:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchToolkit();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>
      </div>
    );
  }

  if (!toolkit) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Toolkit not found</h2>
          <Link to="/toolkit" className="text-purple-600 hover:text-purple-700">
            ← Back to Toolkit
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/toolkit" className="text-purple-600 hover:text-purple-700 mb-6 inline-block">
        ← Back to Toolkit
      </Link>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {toolkit.image_url && (
          <div className="h-80 bg-gray-100">
            <img
              src={toolkit.image_url}
              alt={toolkit.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/1200x400?text=Toolkit';
              }}
            />
          </div>
        )}

        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{toolkit.title}</h1>
          
          <p className="text-lg text-gray-700 mb-8">{toolkit.description}</p>

          {/* Overview Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-700 whitespace-pre-line">{toolkit.overview}</p>
          </div>

          {/* Key Capabilities */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Capabilities</h2>
            <p className="text-gray-700 whitespace-pre-line">{toolkit.key_capabilities}</p>
          </div>

          {/* Why It's Included */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why It's Included</h2>
            <p className="text-gray-700 whitespace-pre-line">{toolkit.why_it_is_included}</p>
          </div>

          {/* Getting Started */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
            <p className="text-gray-700 whitespace-pre-line">{toolkit.resources_on_getting_started}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* License & Compliance */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">License & Compliance</h3>
              <p className="text-gray-700 whitespace-pre-line">{toolkit.license_and_compliance}</p>
            </div>

            {/* Version Info */}
            {toolkit.versioning_and_community_info && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Version & Community</h3>
                <p className="text-gray-700 whitespace-pre-line">{toolkit.versioning_and_community_info}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Get Started
            </button>
            <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
