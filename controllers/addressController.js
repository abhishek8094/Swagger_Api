const Address = require('../models/Address');

// @desc    Get all addresses
// @route   GET /api/addresses
// @access  Public
exports.getAddresses = async (req, res, next) => {
  try {
    // Sort by defaultAddress descending first, then by createdAt descending
    const addresses = await Address.find().sort({ defaultAddress: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Get single address
// @route   GET /api/addresses/:id
// @access  Public
exports.getAddress = async (req, res, next) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      const error = new Error('Address not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Create new address
// @route   POST /api/addresses
// @access  Public
exports.createAddress = async (req, res, next) => {
  try {
    const { countryRegion, firstName, lastName, address, apartmentSuite, city, state, pinCode, phone, defaultAddress } = req.body;

    if (defaultAddress) {
      // Unset defaultAddress for all other addresses
      await Address.updateMany({ defaultAddress: true }, { defaultAddress: false });
    }

    const newAddress = await Address.create({
      user: req.user._id,
      countryRegion,
      firstName,
      lastName,
      address,
      apartmentSuite,
      city,
      state,
      pinCode,
      phone,
      defaultAddress
    });

    res.status(201).json({
      success: true,
      data: newAddress
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Public
exports.updateAddress = async (req, res, next) => {
  try {
    const { countryRegion, firstName, lastName, address, apartmentSuite, city, state, pinCode, phone, defaultAddress } = req.body;

    if (defaultAddress) {
      // Unset defaultAddress for all other addresses except this one
      await Address.updateMany({ defaultAddress: true, _id: { $ne: req.params.id } }, { defaultAddress: false });
    }

    const updatedAddress = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        countryRegion,
        firstName,
        lastName,
        address,
        apartmentSuite,
        city,
        state,
        pinCode,
        phone,
        defaultAddress
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedAddress) {
      const error = new Error('Address not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: updatedAddress
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Public
exports.deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      const error = new Error('Address not found');
      error.statusCode = 404;
      return next(error);
    }

    const wasDefault = address.defaultAddress;

    await Address.findByIdAndDelete(req.params.id);

    if (wasDefault) {
      // Set another address as default if any exist
      const anotherAddress = await Address.findOne();
      if (anotherAddress) {
        anotherAddress.defaultAddress = true;
        await anotherAddress.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};