import User from '../../models/userScheme.js';

// Get All Users with Pagination and Filtering (Admin Only)
export const GetAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const banned = req.query.banned; // optional filter
    const kycStatus = req.query.kycStatus; // optional filter
    const signupMethod = req.query.signupMethod; // optional filter
    const skip = (page - 1) * limit;

    const query = {};
    if (banned !== undefined) query.banned = banned === 'true';
    if (kycStatus) query.kycStatus = kycStatus;
    if (signupMethod) query.signupMethod = signupMethod;

    const users = await User.find(query)
      .select('-password -__v')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalCount = await User.countDocuments(query);

    res.status(200).json({
      message: "Operation successful",
      data: users,
      totalCount,
      page,
      limit,
      error: false,
      success: true,
    });
  } catch (error) {
    console.error('GetAllUsers error:', error.message);
    next(error);
  }
};

export const banUser = async (req, res, next) => {
  const { userId } = req.params;
  const { banned } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", error: true, success: false });
    }

    user.banned = banned;
    await user.save();

    res.status(200).json({
      message: `User ${banned ? 'banned' : 'unbanned'} successfully`,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", error: true, success: false });
    }
    res.status(200).json({ message: "User deleted successfully", success: true });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  const { userId } = req.params;
  const updates = req.body;
  try {
    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found", error: true, success: false });
    }
    res.status(200).json({ message: "User updated successfully", data: user, success: true });
  } catch (error) {
    next(error);
  }
};