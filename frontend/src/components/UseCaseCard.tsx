import { Link } from 'react-router-dom';
import type { UseCase } from '../types';

interface UseCaseCardProps {
  useCase: UseCase;
}

export default function UseCaseCard({ useCase }: UseCaseCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-200">
      <div className="flex flex-col h-full">
        {useCase.image_url && (
          <div className="mb-4 h-40 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={useCase.image_url}
              alt={useCase.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Use+Case';
              }}
            />
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {useCase.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
          {useCase.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {useCase.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {useCase.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{useCase.tags.length - 3}
            </span>
          )}
        </div>

        <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            <span className="font-medium">Sector:</span> {useCase.sector}
          </span>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          <span className="font-medium">Source:</span> {useCase.source_org}
        </p>

        <Link
          to={`/usecases/${useCase.id}`}
          className="mt-auto block text-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
