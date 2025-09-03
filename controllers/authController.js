const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

// Generate JWT Token
const sendTokenResponse = (user, statusCode, res) => {
  // Create token with user verification status
  const token = jwt.sign({ 
    id: user._id,
    isVerified: user.isVerified 
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  const options = {
    expires: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        email: user.email,
        isVerified: user.isVerified
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { firstName, email, password } = req.body;

    // Validate firstName, email & password
    if (!firstName || !email || !password) {
      const error = new Error('Please provide a firstName, email and password');
      error.statusCode = 400;
      return next(error);
    }

    // Create user
    const user = await User.create({
      firstName,
      email,
      password,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    if (error.code === 11000) {
      const err = new Error('User already exists with this email');
      err.statusCode = 400;
      return next(err);
    }
    
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      const error = new Error('Please provide an email and password');
      error.statusCode = 400;
      return next(error);
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      return next(error);
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      const error = new Error('Password is wrong');
      error.statusCode = 401;
      return next(error);
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error('No user found with this email');
      error.statusCode = 404;
      return next(error);
    }

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Return reset token in response instead of sending email
    res.status(200).json({
      success: true,
      message: 'Reset token generated successfully',
      resetToken: resetToken, // Return the plain token for testing
      expiresIn: '10 minutes'
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      const error = new Error('Invalid token');
      error.statusCode = 400;
      return next(error);
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Skip sending confirmation email to avoid using EMAIL_USER/EMAIL_PASS
    sendTokenResponse(user, 200, res);
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};


// @desc    Update user profile
// @route   POST /api/auth/me
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName } = req.body;

    // Validate at least one field is provided
    if (!firstName && !lastName) {
      const error = new Error('Please provide firstName or lastName to update');
      error.statusCode = 400;
      return next(error);
    }

    // Build update object
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error.code === 11000) {
      const err = new Error('Duplicate field value entered');
      err.statusCode = 400;
      return next(err);
    }
    
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};
