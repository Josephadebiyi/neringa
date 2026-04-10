import Route from '../models/RouteModel.js';
import { Shipment, isAfricanCountry, getPaymentGatewayForCountry, getCurrencyForCountry } from '../models/ShipmentModel.js';

/**
 * Create a new shipping route (Admin only)
 */
export const createRoute = async (req, res) => {
  try {
    const {
      originCity,
      originCountry,
      originCountryCode,
      destinationCity,
      destinationCountry,
      destinationCountryCode,
      basePricePerKg,
      currency,
      travelerCommissionPercent,
      minWeightKg,
      maxWeightKg,
      estimatedDeliveryMinDays,
      estimatedDeliveryMaxDays,
      supportedTransportModes,
      notes,
    } = req.body;

    // Validate required fields
    if (!originCity || !originCountryCode || !destinationCity || !destinationCountryCode || !basePricePerKg) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: originCity, originCountryCode, destinationCity, destinationCountryCode, basePricePerKg',
      });
    }

    // Check if route already exists
    const existingRoute = await Route.findOne({
      originCity: { $regex: new RegExp(`^${originCity}$`, 'i') },
      originCountryCode: originCountryCode.toUpperCase(),
      destinationCity: { $regex: new RegExp(`^${destinationCity}$`, 'i') },
      destinationCountryCode: destinationCountryCode.toUpperCase(),
    });

    if (existingRoute) {
      return res.status(409).json({
        success: false,
        message: 'This route already exists',
        existingRoute: {
          id: existingRoute._id,
          displayName: existingRoute.displayName,
        },
      });
    }

    const route = new Route({
      originCity,
      originCountry,
      originCountryCode: originCountryCode.toUpperCase(),
      destinationCity,
      destinationCountry,
      destinationCountryCode: destinationCountryCode.toUpperCase(),
      basePricePerKg,
      currency: currency || 'NGN',
      travelerCommissionPercent: travelerCommissionPercent || 70,
      minWeightKg: minWeightKg || 0.5,
      maxWeightKg: maxWeightKg || 30,
      estimatedDeliveryMinDays: estimatedDeliveryMinDays || 3,
      estimatedDeliveryMaxDays: estimatedDeliveryMaxDays || 7,
      supportedTransportModes: supportedTransportModes || ['air', 'bus'],
      notes,
      createdBy: req.admin?._id,
    });

    await route.save();

    console.log(`✅ New route created: ${route.displayName}`);

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      route: {
        id: route._id,
        displayName: route.displayName,
        originCity: route.originCity,
        originCountry: route.originCountry,
        originCountryCode: route.originCountryCode,
        destinationCity: route.destinationCity,
        destinationCountry: route.destinationCountry,
        destinationCountryCode: route.destinationCountryCode,
        basePricePerKg: route.basePricePerKg,
        currency: route.currency,
        travelerCommissionPercent: route.travelerCommissionPercent,
        platformFeePercent: route.platformFeePercent,
        isAfricanRoute: route.isAfricanRoute,
        isActive: route.isActive,
      },
    });
  } catch (err) {
    console.error('❌ Create route error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create route', error: err.message });
  }
};

/**
 * Get all routes (with optional filters)
 */
export const getAllRoutes = async (req, res) => {
  try {
    const { 
      originCountry, 
      destinationCountry, 
      isActive, 
      isAfricanRoute,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};
    
    if (originCountry) {
      filter.originCountryCode = originCountry.toUpperCase();
    }
    if (destinationCountry) {
      filter.destinationCountryCode = destinationCountry.toUpperCase();
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    if (isAfricanRoute !== undefined) {
      filter.isAfricanRoute = isAfricanRoute === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [routes, total] = await Promise.all([
      Route.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Route.countDocuments(filter),
    ]);

    res.json({
      success: true,
      routes: routes.map(r => ({
        id: r._id,
        displayName: `${r.originCity}, ${r.originCountryCode} → ${r.destinationCity}, ${r.destinationCountryCode}`,
        originCity: r.originCity,
        originCountry: r.originCountry,
        originCountryCode: r.originCountryCode,
        destinationCity: r.destinationCity,
        destinationCountry: r.destinationCountry,
        destinationCountryCode: r.destinationCountryCode,
        basePricePerKg: r.basePricePerKg,
        currency: r.currency,
        travelerCommissionPercent: r.travelerCommissionPercent,
        platformFeePercent: r.platformFeePercent,
        minWeightKg: r.minWeightKg,
        maxWeightKg: r.maxWeightKg,
        estimatedDeliveryMinDays: r.estimatedDeliveryMinDays,
        estimatedDeliveryMaxDays: r.estimatedDeliveryMaxDays,
        supportedTransportModes: r.supportedTransportModes,
        isAfricanRoute: r.isAfricanRoute,
        isActive: r.isActive,
        notes: r.notes,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('❌ Get routes error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch routes', error: err.message });
  }
};

/**
 * Get a single route by ID
 */
export const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const route = await Route.findById(id).lean();
    
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    res.json({
      success: true,
      route: {
        id: route._id,
        displayName: `${route.originCity}, ${route.originCountryCode} → ${route.destinationCity}, ${route.destinationCountryCode}`,
        originCity: route.originCity,
        originCountry: route.originCountry,
        originCountryCode: route.originCountryCode,
        destinationCity: route.destinationCity,
        destinationCountry: route.destinationCountry,
        destinationCountryCode: route.destinationCountryCode,
        basePricePerKg: route.basePricePerKg,
        currency: route.currency,
        travelerCommissionPercent: route.travelerCommissionPercent,
        platformFeePercent: route.platformFeePercent,
        minWeightKg: route.minWeightKg,
        maxWeightKg: route.maxWeightKg,
        estimatedDeliveryMinDays: route.estimatedDeliveryMinDays,
        estimatedDeliveryMaxDays: route.estimatedDeliveryMaxDays,
        supportedTransportModes: route.supportedTransportModes,
        isAfricanRoute: route.isAfricanRoute,
        isActive: route.isActive,
        notes: route.notes,
        createdAt: route.createdAt,
        updatedAt: route.updatedAt,
      },
    });
  } catch (err) {
    console.error('❌ Get route error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch route', error: err.message });
  }
};

/**
 * Update a route (Admin only)
 */
export const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const route = await Route.findById(id);
    
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'originCity', 'originCountry', 'originCountryCode',
      'destinationCity', 'destinationCountry', 'destinationCountryCode',
      'basePricePerKg', 'currency', 'travelerCommissionPercent',
      'minWeightKg', 'maxWeightKg',
      'estimatedDeliveryMinDays', 'estimatedDeliveryMaxDays',
      'supportedTransportModes', 'isActive', 'notes',
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'originCountryCode' || field === 'destinationCountryCode') {
          route[field] = updates[field].toUpperCase();
        } else {
          route[field] = updates[field];
        }
      }
    });

    route.updatedBy = req.admin?._id;
    await route.save();

    console.log(`✅ Route updated: ${route.displayName}`);

    res.json({
      success: true,
      message: 'Route updated successfully',
      route: {
        id: route._id,
        displayName: route.displayName,
        basePricePerKg: route.basePricePerKg,
        currency: route.currency,
        travelerCommissionPercent: route.travelerCommissionPercent,
        platformFeePercent: route.platformFeePercent,
        isActive: route.isActive,
      },
    });
  } catch (err) {
    console.error('❌ Update route error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update route', error: err.message });
  }
};

/**
 * Delete a route (Admin only)
 */
export const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;

    const route = await Route.findById(id);
    
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    // Check if route has active shipments
    const activeShipments = await Shipment.countDocuments({
      routeId: id,
      status: { $in: ['pending_pickup', 'in_transit'] },
    });

    if (activeShipments > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete route with ${activeShipments} active shipment(s). Please complete or cancel them first.`,
      });
    }

    await Route.findByIdAndDelete(id);

    console.log(`🗑️ Route deleted: ${route.displayName}`);

    res.json({
      success: true,
      message: 'Route deleted successfully',
    });
  } catch (err) {
    console.error('❌ Delete route error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete route', error: err.message });
  }
};

/**
 * Search routes by origin and destination (Public endpoint for mobile app)
 */
export const searchRoutes = async (req, res) => {
  try {
    const { from, to, fromCountry, toCountry } = req.query;

    if (!from && !to && !fromCountry && !toCountry) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one search parameter: from, to, fromCountry, or toCountry',
      });
    }

    const filter = { isActive: true };

    if (from) {
      filter.originCity = { $regex: new RegExp(from, 'i') };
    }
    if (to) {
      filter.destinationCity = { $regex: new RegExp(to, 'i') };
    }
    if (fromCountry) {
      filter.originCountryCode = fromCountry.toUpperCase();
    }
    if (toCountry) {
      filter.destinationCountryCode = toCountry.toUpperCase();
    }

    const routes = await Route.find(filter)
      .sort({ basePricePerKg: 1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      routes: routes.map(r => ({
        id: r._id,
        displayName: `${r.originCity}, ${r.originCountryCode} → ${r.destinationCity}, ${r.destinationCountryCode}`,
        originCity: r.originCity,
        originCountry: r.originCountry,
        originCountryCode: r.originCountryCode,
        destinationCity: r.destinationCity,
        destinationCountry: r.destinationCountry,
        destinationCountryCode: r.destinationCountryCode,
        basePricePerKg: r.basePricePerKg,
        currency: r.currency,
        travelerCommissionPercent: r.travelerCommissionPercent,
        minWeightKg: r.minWeightKg,
        maxWeightKg: r.maxWeightKg,
        estimatedDeliveryMinDays: r.estimatedDeliveryMinDays,
        estimatedDeliveryMaxDays: r.estimatedDeliveryMaxDays,
        supportedTransportModes: r.supportedTransportModes,
        isAfricanRoute: r.isAfricanRoute,
      })),
    });
  } catch (err) {
    console.error('❌ Search routes error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to search routes', error: err.message });
  }
};

/**
 * Calculate price for a route and weight (Public endpoint for mobile app)
 */
export const calculatePrice = async (req, res) => {
  try {
    const { routeId, weightKg, userCountryCode } = req.body;

    if (!routeId || !weightKg) {
      return res.status(400).json({
        success: false,
        message: 'routeId and weightKg are required',
      });
    }

    const route = await Route.findById(routeId);
    
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    if (!route.isActive) {
      return res.status(400).json({ success: false, message: 'This route is currently inactive' });
    }

    // Validate weight limits
    if (weightKg < route.minWeightKg) {
      return res.status(400).json({
        success: false,
        message: `Minimum weight for this route is ${route.minWeightKg} kg`,
      });
    }

    if (weightKg > route.maxWeightKg) {
      return res.status(400).json({
        success: false,
        message: `Maximum weight for this route is ${route.maxWeightKg} kg`,
      });
    }

    // Calculate pricing
    const pricing = route.calculatePrice(weightKg);
    
    // Determine payment gateway based on user location or route
    const paymentGateway = userCountryCode 
      ? getPaymentGatewayForCountry(userCountryCode)
      : route.isAfricanRoute ? 'paystack' : 'stripe';

    res.json({
      success: true,
      route: {
        id: route._id,
        displayName: route.displayName,
        originCity: route.originCity,
        originCountryCode: route.originCountryCode,
        destinationCity: route.destinationCity,
        destinationCountryCode: route.destinationCountryCode,
      },
      pricing,
      paymentGateway,
      estimatedDelivery: {
        minDays: route.estimatedDeliveryMinDays,
        maxDays: route.estimatedDeliveryMaxDays,
      },
    });
  } catch (err) {
    console.error('❌ Calculate price error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to calculate price', error: err.message });
  }
};

/**
 * Get pricing for a trip (match route based on trip's origin/destination)
 */
export const getPricingForTrip = async (req, res) => {
  try {
    const { fromCity, fromCountryCode, toCity, toCountryCode, weightKg } = req.body;

    if (!fromCity || !fromCountryCode || !toCity || !toCountryCode) {
      return res.status(400).json({
        success: false,
        message: 'fromCity, fromCountryCode, toCity, and toCountryCode are required',
      });
    }

    // Find matching route
    const route = await Route.findOne({
      originCity: { $regex: new RegExp(`^${fromCity}$`, 'i') },
      originCountryCode: fromCountryCode.toUpperCase(),
      destinationCity: { $regex: new RegExp(`^${toCity}$`, 'i') },
      destinationCountryCode: toCountryCode.toUpperCase(),
      isActive: true,
    });

    if (!route) {
      // Try to find a country-level route if city-level not found
      const countryRoute = await Route.findOne({
        originCountryCode: fromCountryCode.toUpperCase(),
        destinationCountryCode: toCountryCode.toUpperCase(),
        isActive: true,
      }).sort({ basePricePerKg: 1 });

      if (!countryRoute) {
        return res.status(404).json({
          success: false,
          message: 'No pricing available for this route. Please contact admin to set up pricing.',
          routeNotFound: true,
        });
      }

      // Use country-level route
      const pricing = weightKg ? countryRoute.calculatePrice(weightKg) : null;
      
      return res.json({
        success: true,
        exactMatch: false,
        route: {
          id: countryRoute._id,
          displayName: countryRoute.displayName,
          basePricePerKg: countryRoute.basePricePerKg,
          currency: countryRoute.currency,
          travelerCommissionPercent: countryRoute.travelerCommissionPercent,
          minWeightKg: countryRoute.minWeightKg,
          maxWeightKg: countryRoute.maxWeightKg,
        },
        pricing,
        paymentGateway: countryRoute.isAfricanRoute ? 'paystack' : 'stripe',
      });
    }

    const pricing = weightKg ? route.calculatePrice(weightKg) : null;

    res.json({
      success: true,
      exactMatch: true,
      route: {
        id: route._id,
        displayName: route.displayName,
        basePricePerKg: route.basePricePerKg,
        currency: route.currency,
        travelerCommissionPercent: route.travelerCommissionPercent,
        minWeightKg: route.minWeightKg,
        maxWeightKg: route.maxWeightKg,
        estimatedDeliveryMinDays: route.estimatedDeliveryMinDays,
        estimatedDeliveryMaxDays: route.estimatedDeliveryMaxDays,
      },
      pricing,
      paymentGateway: route.isAfricanRoute ? 'paystack' : 'stripe',
    });
  } catch (err) {
    console.error('❌ Get trip pricing error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to get pricing', error: err.message });
  }
};

export { isAfricanCountry, getPaymentGatewayForCountry, getCurrencyForCountry };
