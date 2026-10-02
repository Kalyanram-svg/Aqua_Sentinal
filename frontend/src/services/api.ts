const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('aquasentinel_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('aquasentinel_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('aquasentinel_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || errorMsg;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  register: (data: { email: string; password: string; full_name?: string }) =>
    request<{ access_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  demoLogin: () =>
    request<{ access_token: string; user: any }>('/auth/demo', {
      method: 'POST',
    }),
  getMe: () => request<any>('/auth/me'),

  // Surveys
  getSurveys: () => request<any[]>('/surveys'),
  createSurvey: (data: any) =>
    request<any>('/surveys', { method: 'POST', body: JSON.stringify(data) }),
  getSurveyDetail: (id: number) => request<any>(`/surveys/${id}`),
  getSurveyCoverage: (id: number) => request<any>(`/surveys/${id}/coverage`),
  compareSurveys: (a: number, b: number) => request<any>(`/surveys/compare/${a}/${b}`),

  // Sonar
  uploadSonar: (formData: FormData) =>
    request<any>('/sonar/upload', { method: 'POST', body: formData }),
  enhanceSonar: (imageId: number, params: any) =>
    request<any>(`/sonar/${imageId}/enhance`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  detectObjects: (imageId: number, params: any) =>
    request<any>(`/sonar/${imageId}/detect`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  getImageDetections: (imageId: number) =>
    request<any[]>(`/sonar/${imageId}/detections`),
  getSeabedScenarios: () => request<any>('/sonar/scenarios'),
  measureShadow: (imageId: number, formData: FormData) =>
    request<any>(`/sonar/${imageId}/measure`, {
      method: 'POST',
      body: formData,
    }),
  exportReport: (surveyId: number, format: 'pdf' | 'csv' | 'json') =>
    request<{ download_url: string }>(`/sonar/export/${surveyId}/${format}`, {
      method: 'POST',
    }),

  // Datasets
  getDatasetSources: () => request<any[]>('/datasets/sources'),
  validateSource: (code: string) =>
    request<any>(`/datasets/validate/${code}`, { method: 'POST' }),
  validateDatasetSource: (code: string) =>
    request<any>(`/datasets/validate/${code}`, { method: 'POST' }),
  getDatasetManifest: () => request<any>('/datasets/manifest'),
  getDatasetSummary: () => request<any>('/datasets/summary'),

  // Models
  getModelRecords: () => request<any[]>('/models/records'),
  activateModel: (id: number) => request<any>(`/models/activate/${id}`, { method: 'POST' }),
  getTrainingStatus: () => request<any>('/models/training/status'),
  startTraining: (params: any) =>
    request<any>('/models/training/start', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  cancelTraining: () => request<any>('/models/training/cancel', { method: 'POST' }),
  getModelComparison: () => request<any>('/models/comparison'),

  // Review
  getReviewQueue: (filterBy = 'uncertainty') =>
    request<any[]>(`/review/queue?filter_by=${filterBy}`),
  submitReviewDecision: (decision: any) =>
    request<any>('/review/decision', {
      method: 'POST',
      body: JSON.stringify(decision),
    }),
  getEvidenceChain: (detectionId: number) =>
    request<any>(`/review/evidence-chain/${detectionId}`),

  // Simulations
  getTheaterPing: (lineIndex = 0) =>
    request<any>(`/simulation/theater/ping?line_index=${lineIndex}`),
  getDigitalTwin: () => request<any>('/simulation/digital-twin/bathymetry'),
  getAuvTelemetry: (step = 0) =>
    request<any>(`/simulation/auv-mission/telemetry?step=${step}`),
  getGhostNetDrift: (hours = 24) =>
    request<any>(`/simulation/ghost-net-drift?hours=${hours}`),
  runWhatIf: (params: any) =>
    request<any>('/simulation/what-if/simulate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  getRouteOptimizer: () => request<any>('/simulation/route-optimizer'),
  getHolographicHotspots: () => request<any[]>('/simulation/holographic-globe/hotspots'),
  getCalibrationMetrics: () => request<any>('/simulation/calibration-lab'),
  getTimeMachine: (years = 1) =>
    request<any>(`/simulation/time-machine?years=${years}`),
  getEcologicalImpact: () => request<any>('/simulation/ecological-impact'),

  // Assistant & Telemetry
  chatAssistant: (msg: string, surveyId?: number) =>
    request<any>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message: msg, survey_id: surveyId }),
    }),
  getTelemetry: () => request<any>('/analytics/telemetry'),
  getAuditLogs: () => request<any[]>('/analytics/audit-logs'),
  getEdgeArena: () => request<any>('/analytics/edge-arena'),
  getNotifications: () => request<any[]>('/analytics/notifications'),
};
