const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.handleRefreshToken = async (req, res, next) => {
  let refreshToken;
  if (req.cookies.jwt) {
    refreshToken = req.cookies.jwt;
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  }

  //NOTE: steps :
  // find user that matches refresh token TEMP SOLUTION
  const user = await User.find({ refreshToken: [refreshToken] });
  if (!user) return res.sendStatus(403);

  try {
    const decoded = await promisify(jwt.verify)(
      refreshToken,
      process.env.JWT_REFRESH_KEY
    );
    const newRefreshToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_REFRESH_KEY,
      {
        expiresIn: process.env.JWT_REFRESH_KEY_EXPIRES_IN,
      }
    );
    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_ACCESS_KEY,
      {
        expiresIn: process.env.JWT_ACCESS_KEY_EXPIRES_IN,
      }
    );
    const cookieOptions = {
      maxAge: process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    };
    // NOTE: we still need to save it to our DB!!! TEMP SOLUTION
    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      {
        refreshToken: [newRefreshToken],
      },
      { new: true }
    );
    // console.log({
    //   id: decoded.id,
    //   user,
    //   refreshToken,
    //   newRefreshToken,
    //   updatedUser,
    // });
    res.cookie('jwt', newRefreshToken, cookieOptions);
    res.status(201).json({
      status: 'success',
      accessToken,
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    res.status(403).json({ message: 'unauthorized', error: err });
  }
};
