/**
 * AI API client — wraps all /api/ai/* endpoints
 */
import { api } from './client';

// Dashboard aggregate
export const getAIDashboard = () => api.get('/ai/dashboard');

// Per-job full AI summary (main endpoint used by JobDetail)
export const getJobAISummary = (jobId) => api.get(`/ai/job/${jobId}`);

// Wastage prediction
export const predictWastage = (data) => api.post('/ai/predict/wastage', data);

// Efficiency prediction
export const predictEfficiency = (data) => api.post('/ai/predict/efficiency', data);

// Smart suggestions
export const getAISuggestions = (params) => api.get('/ai/suggestions', { params });

// Alerts
export const getAIAlerts = (params) => api.get('/ai/alerts', { params });

// Worker performance
export const getWorkerPerformance = () => api.get('/ai/worker-performance');

// Prediction history for a job
export const getPredictionHistory = (jobId) => api.get(`/ai/prediction-history/${jobId}`);
