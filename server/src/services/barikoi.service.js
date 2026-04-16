const axios = require('axios');

const BARIKOI_API_BASE_URL = 'https://barikoi.xyz/v2/api';

function getBarikoiUrl(endpoint) {
  const apiKey = process.env.BARIKOI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ BARIKOI_API_KEY is missing. Using mock data for autocomplete.');
    return null;
  }
  return `${BARIKOI_API_BASE_URL}/${endpoint}?api_key=${apiKey}`;
}

async function autocomplete(query, limit = 5) {
  if (!query) throw new Error('Query parameter is required');
  
  const url = getBarikoiUrl('search/autocomplete');
  if (!url) {
    // Return mock data for testing
    return getMockSuggestions(query, limit);
  }

  try {
    const response = await axios.get(url, { 
      params: { q: query, limit },
      timeout: 5000
    });
    return response.data?.places || [];
  } catch (error) {
    console.error('Barikoi Autocomplete Error:', error.response?.data || error.message);
    // Return mock data on failure
    return getMockSuggestions(query, limit);
  }
}

// Mock data for testing when Barikoi is unavailable
function getMockSuggestions(query, limit) {
  const mockPlaces = [
    {
      id: 'mock_1',
      address: 'BRAC University, Merul Badda, Dhaka',
      latitude: 23.773487,
      longitude: 90.424543,
    },
    {
      id: 'mock_2',
      address: 'Dhanmondi 27, Dhaka',
      latitude: 23.7458,
      longitude: 90.3833,
    },
    {
      id: 'mock_3',
      address: 'Gulshan 1, Dhaka',
      latitude: 23.7916,
      longitude: 90.4139,
    },
    {
      id: 'mock_4',
      address: 'Uttara Sector 4, Dhaka',
      latitude: 23.8759,
      longitude: 90.3986,
    },
    {
      id: 'mock_5',
      address: 'Banani 11, Dhaka',
      latitude: 23.7939,
      longitude: 90.4066,
    }
  ];
  
  // Filter mock places that contain the query (case-insensitive)
  const filtered = mockPlaces.filter(p => 
    p.address.toLowerCase().includes(query.toLowerCase())
  );
  return filtered.slice(0, limit);
}

async function geocodeAddress(address) {
  if (!address) throw new Error('Address is required');
  
  const url = getBarikoiUrl('search/autocomplete');
  if (!url) {
    // Mock geocode
    return {
      lat: 23.8103,
      lng: 90.4125,
      formattedAddress: address,
      placeId: `mock_${Date.now()}`
    };
  }

  try {
    const response = await axios.get(url, { 
      params: { q: address, limit: 1 },
      timeout: 5000
    });
    const places = response.data?.places;
    if (!places || places.length === 0) {
      return {
        lat: 23.8103,
        lng: 90.4125,
        formattedAddress: address,
        placeId: `fallback_${Date.now()}`
      };
    }
    const best = places[0];
    return {
      lat: best.latitude,
      lng: best.longitude,
      formattedAddress: best.address,
      placeId: best.id?.toString() || `barikoi_${Date.now()}`
    };
  } catch (error) {
    console.error('Barikoi Geocode Error:', error.response?.data || error.message);
    return {
      lat: 23.8103,
      lng: 90.4125,
      formattedAddress: address,
      placeId: `fallback_${Date.now()}`
    };
  }
}

module.exports = { autocomplete, geocodeAddress };