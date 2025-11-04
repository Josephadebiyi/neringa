import User from '../../models/userScheme.js';

// Get All Users with Pagination (Admin Only)
export const GetAllUsers = async (req, res, next) => {
  try {
    // Extract query params for pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch users with pagination, excluding sensitive fields
    const users = await User.find({})
      .select('-password -__v')  // Exclude password and version key
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });  // Sort by newest first

    // Get total count for pagination
    const totalCount = await User.countDocuments({});

    if (users.length === 0) {
      return res.status(200).json({
        message: "No users found",
        data: [],
        totalCount: 0,
        page,
        limit,
        error: false,
        success: true,
      });
    }

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
    console.error('GetAllUsers error:', error.message, error.stack);
    next(error);  // Pass to error handler middleware
  }
};


export const banUser = async (req, res, next) => {
  const { userId } = req.params;
  const { banned } = req.body;  // true/false

  try {
    if (typeof banned !== 'boolean') {
      return res.status(400).json({ message: "banned must be a boolean", error: true, success: false });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", error: true, success: false });
    }

    user.banned = banned;
    await user.save();

    res.status(200).json({
      message: `User ${banned ? 'banned' : 'unbanned'} successfully`,
      data: user,
      error: false,
      success: true,
    });
  } catch (error) {
    console.error('banUser error:', error.message, error.stack);
    next(error);
  }
};