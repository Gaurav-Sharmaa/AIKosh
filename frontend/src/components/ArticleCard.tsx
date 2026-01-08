import { Link } from 'react-router-dom';
import type { Article } from '../types';

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-gray-200">
      <div className="h-48 bg-gray-100 overflow-hidden">
        <img
          src={article.image_url}
          alt={article.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Article';
          }}
        />
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {article.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {article.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span className="font-medium">{article.author}</span>
          <span>{article.read_time}</span>
        </div>

        <div className="text-xs text-gray-400 mb-4">
          Published: {new Date(article.published_date).toLocaleDateString()}
        </div>

        <Link
          to={`/articles/${article.id}`}
          className="block text-center bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Read Article
        </Link>
      </div>
    </div>
  );
}
