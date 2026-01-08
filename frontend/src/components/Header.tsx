import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">AI</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AIKosh</span>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link to="/" className="text-gray-700 hover:text-orange-600 font-medium">
                Dashboard
              </Link>
              <Link to="/datasets" className="text-gray-700 hover:text-orange-600 font-medium">
                Datasets
              </Link>
              <Link to="/models" className="text-gray-700 hover:text-orange-600 font-medium">
                Models
              </Link>
              <Link to="/usecases" className="text-gray-700 hover:text-orange-600 font-medium">
                Use Cases
              </Link>
              <Link to="/toolkit" className="text-gray-700 hover:text-orange-600 font-medium">
                Toolkit
              </Link>
              <Link to="/tutorials" className="text-gray-700 hover:text-orange-600 font-medium">
                Tutorials
              </Link>
              <Link to="/articles" className="text-gray-700 hover:text-orange-600 font-medium">
                Articles
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/profile"
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Profile
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
