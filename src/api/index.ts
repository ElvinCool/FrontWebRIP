import { Api, HttpClient } from './Api';
import { dest_api } from '../target_config';

const httpClient = new HttpClient({
  baseURL: dest_api,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Убеждаемся, что withCredentials установлен для всех запросов
if (httpClient.instance.defaults) {
  httpClient.instance.defaults.withCredentials = true;
}

export const api = new Api(httpClient);

