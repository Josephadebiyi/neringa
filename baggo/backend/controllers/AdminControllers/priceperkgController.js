import PricePerKg from "../../models/pricePerKgSchema.js";

// CREATE
export const createPrice = async (req, res) => {
  try {
    const price = await PricePerKg.create(req.body);
    res.status(201).json({ message: "Price created successfully", price });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// READ ALL
export const getAllPrices = async (req, res) => {
  try {
    const prices = await PricePerKg.find().sort({ createdAt: -1 });
    res.status(200).json(prices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// READ ONE
export const getPriceById = async (req, res) => {
  try {
    const price = await PricePerKg.findById(req.params.id);
    if (!price) return res.status(404).json({ message: "Price not found" });
    res.status(200).json(price);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE
export const updatePrice = async (req, res) => {
  try {
    const price = await PricePerKg.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!price) return res.status(404).json({ message: "Price not found" });
    res.status(200).json({ message: "Price updated successfully", price });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE
export const deletePrice = async (req, res) => {
  try {
    const price = await PricePerKg.findByIdAndDelete(req.params.id);
    if (!price) return res.status(404).json({ message: "Price not found" });
    res.status(200).json({ message: "Price deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
