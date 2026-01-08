import { Link } from 'react-router-dom';
import type { Toolkit } from '../types';

interface ToolkitCardProps {
  toolkit: Toolkit;
}

export default function ToolkitCard({ toolkit }: ToolkitCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-200">
      <div className="flex flex-col h-full">
        {toolkit.image_url && (
          <div className="mb-4 h-40 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={toolkit.image_url}
              alt={toolkit.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Toolkit';
              }}
            />
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {toolkit.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
          {toolkit.description}
        </p>

        {toolkit.license_and_compliance && (
          <div className="mb-4">
            <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
              {toolkit.license_and_compliance.split('\n')[0].replace('License: ', '')}
            </span>
          </div>
        )}

        <Link
          to={`/toolkit/${toolkit.id}`}
          className="mt-auto block text-center bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
