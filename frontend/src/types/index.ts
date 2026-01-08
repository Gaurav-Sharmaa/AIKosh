export interface Dashboard {
  greeting: string;
  role: string;
  login_streak: number;
  artifacts_viewed: ArtifactsViewed;
  artifacts_downloaded: ArtifactsDownloaded;
  last_login: string;
}

export interface ArtifactsViewed {
  datasets: number;
  models: number;
  use_cases: number;
}

export interface ArtifactsDownloaded {
  datasets: number;
  models: number;
}

export interface Dataset {
  id: number;
  title: string;
  description: string;
  about_dataset: string;
  image_url: string | null;
  likes_count: number;
  downloads_count: number;
  views_count: number;
  source_org: string | null;
  tags: string[];
  license: string;
  geographical_coverage: string;
  sector: string;
  author: string;
  source_organisation: string;
  uploaded_by: string;
  data_quality_score: string | null;
  dataset_type: string;
  frequency: string;
  time_granularity: string;
  year_range: string | null;
  date_and_time: string;
  visibility: string;
  hosted: string;
  data_type: string | null;
  data_collection_method: string | null;
}

export interface Model {
  id: number;
  title: string;
  description: string;
  about_model: string;
  image_url: string | null;
  tags: string[];
  likes_count: number;
  downloads_count: number;
  source_org: string;
  license: string;
  hosted_by: string;
  model_type: string;
  model_format: string;
  visibility: string;
  source_organization: string;
  sector: string;
  updated_at: string;
  created_by: string;
  size: string;
}

export interface UseCase {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  source_org: string;
  tags: string[];
  sector: string;
  about_use_case: string;
}

export interface Tutorial {
  id: number;
  title: string;
  description: string;
  duration: string;
  video_url: string;
  uploaded_date: string;
}

export interface Article {
  id: number;
  title: string;
  description: string;
  content: string | null;
  image_url: string;
  author: string;
  read_time: string;
  published_date: string;
}

export interface Toolkit {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  overview: string;
  key_capabilities: string;
  why_it_is_included: string;
  resources_on_getting_started: string;
  license_and_compliance: string;
  screenshots_and_ui_previews: string | null;
  versioning_and_community_info: string | null;
}

export interface User {
  id: number;
  full_name: string;
  username: string;
  bio: string;
  employee_id: string | null;
  profile_picture_url: string | null;
  role: string;
}
