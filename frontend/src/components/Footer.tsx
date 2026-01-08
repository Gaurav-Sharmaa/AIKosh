import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">AIKosh</h3>
            <p className="text-sm text-gray-400">
              India's AI Repository for Datasets, Models, and AI Resources
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/datasets" className="hover:text-orange-500">
                  Datasets
                </Link>
              </li>
              <li>
                <Link to="/models" className="hover:text-orange-500">
                  Models
                </Link>
              </li>
              <li>
                <Link to="/usecases" className="hover:text-orange-500">
                  Use Cases
                </Link>
              </li>
              <li>
                <Link to="/toolkit" className="hover:text-orange-500">
                  Toolkit
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Learn</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/tutorials" className="hover:text-orange-500">
                  Tutorials
                </Link>
              </li>
              <li>
                <Link to="/articles" className="hover:text-orange-500">
                  Articles
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-orange-500">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-500">
                  User Manual
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-500">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center text-gray-400">
          <p>© 2025 AIKosh. All rights reserved. Government of India Initiative.</p>
        </div>
      </div>
    </footer>
  );
}
