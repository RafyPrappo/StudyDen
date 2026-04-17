const express = require('express');
const requireAuth = require('../middleware/auth.middleware');
const { searchLocations } = require('../controllers/barikoi.controller');
const { geocodeAddress } = require('../services/barikoi.service');

const router = express.Router();

// Combined search (Barikoi + local spots)
router.get('/search', requireAuth, searchLocations);

// Legacy autocomplete
router.get('/autocomplete', requireAuth, searchLocations);

// Geocode
router.get('/geocode', requireAuth, async (req, res, next) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ message: 'Address parameter is required' }); //sdfsdf
    }
    const result = await geocodeAddress(address);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;