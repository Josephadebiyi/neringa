import Location from '../../models/LocationModel.js';

// Get all locations
export const getAllLocations = async (req, res, next) => {
    try {
        const locations = await Location.find().sort({ name: 1 });
        res.status(200).json({ success: true, data: locations });
    } catch (error) {
        next(error);
    }
};

// Create a new location
export const createLocation = async (req, res, next) => {
    try {
        const { name, code, type, isAfrican, supportedCurrencies } = req.body;

        // check if exists
        const existing = await Location.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: existing.name === name ? 'Location name already exists' : 'Location code already exists'
            });
        }

        const newLocation = new Location({
            name,
            code: code.toUpperCase(),
            type: type || 'country',
            isAfrican: !!isAfrican,
            supportedCurrencies: supportedCurrencies || ['NGN'],
        });

        await newLocation.save();
        res.status(201).json({ success: true, data: newLocation });
    } catch (error) {
        next(error);
    }
};

// Update a location
export const updateLocation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, code, type, isActive, isAfrican, supportedCurrencies } = req.body;

        const loc = await Location.findById(id);
        if (!loc) {
            return res.status(404).json({ success: false, message: 'Location not found' });
        }

        if (name) loc.name = name;
        if (code) loc.code = code.toUpperCase();
        if (type) loc.type = type;
        if (isActive !== undefined) loc.isActive = isActive;
        if (isAfrican !== undefined) loc.isAfrican = isAfrican;
        if (supportedCurrencies) loc.supportedCurrencies = supportedCurrencies;

        await loc.save();
        res.status(200).json({ success: true, data: loc });
    } catch (error) {
        next(error);
    }
};

// Delete a location
export const deleteLocation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await Location.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Location not found' });
        }
        res.status(200).json({ success: true, message: 'Location deleted successfully' });
    } catch (error) {
        next(error);
    }
};
