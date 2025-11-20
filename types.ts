export enum DetectionStatus {
  LOADING = 'LOADING',
  READY = 'READY',
  ERROR = 'ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

export interface PredictionResult {
  isTongueOut: boolean;
  score: number;
}

export interface CatState {
  mode: 'GOOFY' | 'SERIOUS';
  message: string;
  imageSeed: number;
}