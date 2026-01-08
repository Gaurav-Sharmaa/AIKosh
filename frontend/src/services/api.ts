import axios from 'axios';
import type {
  Dashboard,
  Dataset,
  Model,
  UseCase,
  Tutorial,
  Article,
  Toolkit,
  User,
} from '../types';

// TODO: convert into 
const API_BASE = 'http://127.0.0.1:3000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard
export const getDashboard = () => api.get<Dashboard>('/dashboard');

// Datasets
export const getDatasets = () => api.get<Dataset[]>('/datasets');
export const getDatasetById = (id: number) => api.get<Dataset>(`/datasets/${id}`);

// Models
export const getModels = () => api.get<Model[]>('/models');
export const getModelById = (id: number) => api.get<Model>(`/models/${id}`);

// Use Cases
export const getUseCases = () => api.get<UseCase[]>('/usecases');
export const getUseCaseById = (id: number) => api.get<UseCase>(`/usecases/${id}`);

// Tutorials
export const getTutorials = () => api.get<Tutorial[]>('/tutorials');

// Articles
export const getArticles = () => api.get<Article[]>('/articles');
export const getArticleById = (id: number) => api.get<Article>(`/articles/${id}`);

// Toolkit
export const getToolkit = () => api.get<Toolkit[]>('/toolkit');
export const getToolkitById = (id: number) => api.get<Toolkit>(`/toolkit/${id}`);

// User
export const getUserProfile = () => api.get<User>('/users/profile');
export const updateUserProfile = (data: Partial<User>) => 
  api.patch<User>('/users/profile', data);

export default api;
