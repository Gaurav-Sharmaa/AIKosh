import axios from "axios";
import type {
  Dashboard,
  Dataset,
  Model,
  UseCase,
  Tutorial,
  Article,
  Toolkit,
  User,
} from "../types";

const API_BASE = "http://127.0.0.1:3000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getDashboard = () => api.get<Dashboard>("/dashboard");

export const getDatasets = (search?: string) =>
  api.get<Dataset[]>("/datasets", { params: search ? { search } : {} });
export const getDatasetById = (id: number) =>
  api.get<Dataset>(`/datasets/${id}`);

export const getModels = (search?: string) =>
  api.get<Model[]>("/models", { params: search ? { search } : {} });
export const getModelById = (id: number) => api.get<Model>(`/models/${id}`);

export const getUseCases = (search?: string) =>
  api.get<UseCase[]>("/usecases", { params: search ? { search } : {} });
export const getUseCaseById = (id: number) =>
  api.get<UseCase>(`/usecases/${id}`);

export const getToolkit = (search?: string) =>
  api.get<Toolkit[]>("/toolkit", { params: search ? { search } : {} });
export const getToolkitById = (id: number) =>
  api.get<Toolkit>(`/toolkit/${id}`);

export const getTutorials = () => api.get<Tutorial[]>("/tutorials");

export const getArticles = () => api.get<Article[]>("/articles");
export const getArticleById = (id: number) =>
  api.get<Article>(`/articles/${id}`);

export const getUserProfile = () => api.get<User>("/users/profile");
export const updateUserProfile = (data: Partial<User>) =>
  api.patch<User>("/users/profile", data);

export default api;
