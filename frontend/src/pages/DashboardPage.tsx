import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard, getDatasets, getModels, getUseCases } from '../services/api';
import type { Dashboard, Dataset, Model, UseCase } from '../types';
import DatasetCard from '../components/DatasetCard';
import ModelCard from '../components/ModelCard';
import UseCaseCard from '../components/UseCaseCard';

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, datasetsRes, modelsRes, useCasesRes] = await Promise.all([
          getDashboard(),
          getDatasets(),
          getModels(),
          getUseCases(),
        ]);

        setDashboard(dashRes.data);
        setDatasets(datasetsRes.data);
        setModels(modelsRes.data);
        setUseCases(useCasesRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Stats Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome to AIKosh
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          India's National AI Repository for Datasets, Models, and Resources
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-4xl font-bold mb-2">{datasets.length}</div>
            <div className="text-orange-100">Datasets</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-4xl font-bold mb-2">{models.length}</div>
            <div className="text-blue-100">Models</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-4xl font-bold mb-2">{useCases.length}</div>
            <div className="text-green-100">Use Cases</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-4xl font-bold mb-2">54+</div>
            <div className="text-purple-100">Organizations</div>
          </div>
        </div>
      </div>

      {/* Dashboard Greeting Card */}
      {dashboard && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-12 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{dashboard.greeting}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Login Streak</div>
              <div className="text-2xl font-bold text-orange-600">{dashboard.login_streak} days</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Artifacts Viewed</div>
              <div className="text-lg font-semibold text-blue-600">
                Datasets: {dashboard.artifacts_viewed.datasets} | 
                Models: {dashboard.artifacts_viewed.models} | 
                Use Cases: {dashboard.artifacts_viewed.use_cases}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Artifacts Downloaded</div>
              <div className="text-lg font-semibold text-green-600">
                Datasets: {dashboard.artifacts_downloaded.datasets} | 
                Models: {dashboard.artifacts_downloaded.models}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Datasets Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Datasets</h2>
          <Link
            to="/datasets"
            className="text-orange-600 hover:text-orange-700 font-medium flex items-center"
          >
            View All
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.slice(0, 6).map((dataset) => (
            <DatasetCard key={dataset.id} dataset={dataset} />
          ))}
        </div>
      </section>

      {/* Models Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Models</h2>
          <Link
            to="/models"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
          >
            View All
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.slice(0, 6).map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Use Cases</h2>
          <Link
            to="/usecases"
            className="text-green-600 hover:text-green-700 font-medium flex items-center"
          >
            View All
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.slice(0, 6).map((useCase) => (
            <UseCaseCard key={useCase.id} useCase={useCase} />
          ))}
        </div>
      </section>
    </div>
  );
}
