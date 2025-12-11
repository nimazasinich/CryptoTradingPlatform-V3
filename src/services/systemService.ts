
import { HttpClient } from './httpClient';
import { API_ENDPOINTS } from '../config/api';

export interface SystemStatus {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

export const systemService = {
  // GET /api/health
  getHealth: async (): Promise<SystemStatus> => {
    return HttpClient.get<SystemStatus>(API_ENDPOINTS.HEALTH, undefined, 10); // 10s cache
  },

  // GET /api/status
  getStatus: async (): Promise<any> => {
    return HttpClient.get<any>(API_ENDPOINTS.STATUS, undefined, 30);
  },
  
  // GET /api/providers
  getProviders: async (): Promise<any> => {
    return HttpClient.get<any>(API_ENDPOINTS.PROVIDERS, undefined, 300); // 5m cache
  }
};
