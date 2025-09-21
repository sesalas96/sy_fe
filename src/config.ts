export const getApiUrl = (): string => {
  return process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app';
};