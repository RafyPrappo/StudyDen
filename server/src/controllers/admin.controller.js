const axios = require("axios");
const Spot = require("../models/Spot");
const User = require("../models/User");

exports.getNearbyPlaces = async (req, res) => {
  try {
    const { lat, lng, radius = 5, limit = 20, category = "all" } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    const apiKey = process.env.BARIKOI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "BARIKOI_API_KEY is missing in .env" });
    }

    console.log("BARIKOI key loaded:", !!process.env.BARIKOI_API_KEY);
    console.log("BARIKOI key prefix:", process.env.BARIKOI_API_KEY?.slice(0, 6));
    console.log("Nearby params:", { lat, lng, radius, limit, category });
    console.log("Nearby URL:", `https://barikoi.xyz/v1/api/search/nearby/${apiKey}/${radius}/${limit}`);

    const response = await axios.get(
      `https://barikoi.xyz/v1/api/search/nearby/${apiKey}/${radius}/${limit}`,
      {
        params: {
          longitude: lng,
          latitude: lat,
        },
        timeout: 30000,
      }
    );

    console.log("Barikoi raw response:", JSON.stringify(response.data, null, 2));

    const rawPlaces = response.data?.Place || response.data?.places || [];

    const normalizedPlaces = rawPlaces.map((place) => ({
      id: place.id || place.uCode || `${place.latitude}-${place.longitude}-${place.name}`,
      name: place.name || "Unknown Place",
      address: place.Address || "",
      latitude: place.latitude,
      longitude: place.longitude,
      distanceInMeters: place.distance_in_meters,
      area: place.area || "",
      city: place.city || "",
      placeType: place.pType || "",
      subType: place.subType || "",
    }));

    let places = normalizedPlaces;

    if (category !== "all") {
      const matchesCategory = (place) => {
        const pType = (place.placeType || "").toLowerCase();
        const subType = (place.subType || "").toLowerCase();
        const combined = `${pType} ${subType}`;

        if (category === "cafe") {
          return combined.includes("cafe") || combined.includes("bakery") || combined.includes("coffee");
        }
        if (category === "coworking") {
          return combined.includes("cowork") || combined.includes("office");
        }
        if (category === "library") {
          return combined.includes("library");
        }
        if (category === "public") {
          return combined.includes("education") || combined.includes("commercial") || combined.includes("food") || combined.includes("cafe") || combined.includes("library");
        }
        return true;
      };
      places = normalizedPlaces.filter(matchesCategory);
    }

    res.json({ places });
  } catch (err) {
    console.error("Barikoi nearby error:", err.response?.data || err.message);
    const message = err.response?.data?.message || err.message || "Failed to fetch nearby places";
    res.status(500).json({ message });
  }
};

exports.importPlace = async (req, res) => {
  try {
    const { name, address, area, city, placeType, subType, latitude, longitude } = req.body;

    if (!name || !address) {
      return res.status(400).json({ message: "name and address are required" });
    }

    const existingSpot = await Spot.findOne({ title: name, address });
    if (existingSpot) {
      return res.status(409).json({ message: "This place has already been imported as a study spot" });
    }

    const descriptionParts = [
      "Imported via Barikoi",
      area ? `Area: ${area}` : null,
      city ? `City: ${city}` : null,
      subType ? `Category: ${subType}` : placeType ? `Category: ${placeType}` : null,
    ].filter(Boolean);

    const newSpot = await Spot.create({
      title: name,
      description: descriptionParts.join(" • "),
      address,
      type: "Public",
      amenities: [],
      postedBy: req.user.id,
      isApproved: true,
      location: {
        lat: latitude,
        lng: longitude,
      },
      verificationStatus: "Unverified",
    });

    res.status(201).json({
      message: "Spot imported successfully",
      spot: newSpot,
    });
  } catch (err) {
    console.error("Import place error:", err);
    res.status(500).json({ message: "Failed to import place" });
  }
};

exports.getPendingSpots = async (req, res, next) => {
  try {
    const spots = await Spot.find({ isApproved: true, verificationStatus: "Unverified" })
      .populate("postedBy", "name email")
      .sort({ createdAt: -1 });
    res.json({ spots });
  } catch (err) {
    next(err);
  }
};

exports.updateSpotStatus = async (req, res, next) => {
  try {
    const { spotId } = req.params;
    const { status } = req.body;

    if (!["Verified", "Unverified", "Commercial"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const spot = await Spot.findByIdAndUpdate(
      spotId,
      {
        verificationStatus: status,
        verifiedBy: req.user.id,
      },
      { new: true }
    );

    if (!spot) {
      return res.status(404).json({ message: "Spot not found" });
    }

    res.json({ spot });
  } catch (err) {
    next(err);
  }
};
const SpotReport = require("../models/SpotReport");

exports.getSpotReports = async (req, res) => {
  const reports = await SpotReport.find({ status: "pending" })
    .populate("spot")
    .populate("reportedBy", "name email")
    .sort({ createdAt: -1 });

  res.json({ reports });
}; 

exports.resolveReport = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; 

  const report = await SpotReport.findById(id).populate("spot");

  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  if (action === "remove") {
    await Spot.findByIdAndDelete(report.spot._id);
  }

  report.status = "resolved";
  await report.save();

  res.json({ message: "Report handled successfully" });
};
