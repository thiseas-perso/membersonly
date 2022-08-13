const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const createSendToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signup = async (req, res, next) => {
  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    email: req.body.email,
  });
  createSendToken(newUser, 200, res);
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  //check if email and password exist
  if (!email || !password) {
    return next(new Error('no username or pwd provided'));
  }
  //check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new Error('Incorrect name or password'));
  }
  //if all good, send token to client
  createSendToken(user, 200, res);
};

exports.logout = async (req, res, next) => {
  res
    .status(200)
    .clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    .json({ message: 'logged out!' });
};

exports.protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return res.json({ message: 'not logged in' });
  }
  const decoded = jwt.verify(token, process.env.JWT_KEY);
  const freshUser = await User.findById(decoded.id);
  req.user = freshUser;
  res.locals.user = freshUser;
  next();
};
