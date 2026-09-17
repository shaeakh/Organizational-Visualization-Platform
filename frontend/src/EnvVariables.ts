export const EnvVariables = {
  PORT: import.meta.env.VITE_PORT || '5173',
  BACKEND_PORT: import.meta.env.VITE_BACKEND_PORT || '3001',
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  API_KEY: import.meta.env.VITE_API_KEY || 'frontend-api-key-abc',
};
