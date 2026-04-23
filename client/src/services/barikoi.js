import { api } from "./apiClient";

export const barikoiApi = {
  search: (query, limit = 5, options = {}) => {
    const url = `/api/barikoi/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    return api.get(url, { signal: options.signal });
  },
  
  autocomplete: (query, limit = 5, options = {}) => {
    return barikoiApi.search(query, limit, options);
  },
  
  geocode: (address) => 
    api.get(`/api/barikoi/geocode?address=${encodeURIComponent(address)}`),
};