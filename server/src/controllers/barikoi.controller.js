const { autocomplete: barikoiAutocomplete } = require('../services/barikoi.service');
const Spot = require('../models/Spot');

exports.searchLocations = async (req, res, next) => {
  try {
    const { q, limit = 5 } = req.query;
    console.log(`🔍 Search query: "${q}", limit: ${limit}`);

    if (!q || q.length < 3) {
<<<<<<< HEAD
=======
      console.log('Query too short, returning empty');
>>>>>>> main
      return res.json({ suggestions: [] });
    }

    // Fetch Barikoi suggestions
    let barikoiResults = [];
    try {
      barikoiResults = await barikoiAutocomplete(q, parseInt(limit));
      console.log(`📍 Barikoi returned ${barikoiResults.length} results`);
    } catch (err) {
      console.error('Barikoi autocomplete failed:', err.message);
    }

    // Search local spots
    const localSpots = await Spot.find({
      isApproved: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } }
      ]
    })
    .select('title address location')
    .limit(parseInt(limit))
    .lean();

    console.log(`🏠 Local spots found: ${localSpots.length}`);

<<<<<<< HEAD
=======
    // Convert local spots to suggestion format
>>>>>>> main
    const localSuggestions = localSpots.map(spot => ({
      id: spot._id.toString(),
      address: spot.address,
      title: spot.title,
      latitude: spot.location?.lat ? Number(spot.location.lat) : null,
      longitude: spot.location?.lng ? Number(spot.location.lng) : null,
      isLocal: true,
      source: 'StudyDen'
    }));

<<<<<<< HEAD
=======
    // Convert Barikoi results (ensure numeric lat/lng)
>>>>>>> main
    const barikoiSuggestions = barikoiResults.map(place => ({
      id: place.id || `barikoi_${Date.now()}_${Math.random()}`,
      address: place.address,
      title: place.address?.split(',')[0] || place.address,
      latitude: place.latitude ? Number(place.latitude) : null,
      longitude: place.longitude ? Number(place.longitude) : null,
      isLocal: false,
      source: 'Barikoi'
    }));

<<<<<<< HEAD
=======
    // Merge: local first, then Barikoi (deduplicate by coordinates)
>>>>>>> main
    const allSuggestions = [...localSuggestions];
    const existingCoords = new Set(
      localSuggestions
        .filter(s => s.latitude != null && s.longitude != null)
        .map(s => `${s.latitude.toFixed(6)},${s.longitude.toFixed(6)}`)
    );

    for (const bs of barikoiSuggestions) {
      if (bs.latitude != null && bs.longitude != null) {
        const coordKey = `${bs.latitude.toFixed(6)},${bs.longitude.toFixed(6)}`;
        if (!existingCoords.has(coordKey)) {
          allSuggestions.push(bs);
          existingCoords.add(coordKey);
        }
      } else {
<<<<<<< HEAD
=======
        // No coordinates – still include (maybe the frontend can handle)
>>>>>>> main
        allSuggestions.push(bs);
      }
    }

    const suggestions = allSuggestions.slice(0, parseInt(limit));
    console.log(`✅ Returning ${suggestions.length} total suggestions`);

    res.json({ suggestions });
  } catch (err) {
    console.error('Search locations error:', err);
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
};