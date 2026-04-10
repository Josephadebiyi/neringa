import Trip from "../models/tripScheme.js";


export const getTravelers = async (req, res) => {
    try {
        const travelers = await Trip.find();
        return res.status(200).json(travelers);
    } catch (error) {
        console.error('Error fetching travelers:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
