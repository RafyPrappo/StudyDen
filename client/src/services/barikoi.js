import { api } from "./apiClient";

export const barikoiApi = {
<<<<<<< HEAD
  // Combined search: Barikoi + local StudyDen spots
=======
>>>>>>> main
  search: (query, limit = 5, options = {}) => {
    const url = `/api/barikoi/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    return api.get(url, { signal: options.signal });
  },
<<<<<<< HEAD

  // Legacy alias (uses same search endpoint)
  autocomplete: (query, limit = 5, options = {}) => {
    return barikoiApi.search(query, limit, options);
  },

  geocode: (address) =>
=======
  
  autocomplete: (query, limit = 5, options = {}) => {
    return barikoiApi.search(query, limit, options);
  },
  
  geocode: (address) => 
>>>>>>> main
    api.get(`/api/barikoi/geocode?address=${encodeURIComponent(address)}`),
};