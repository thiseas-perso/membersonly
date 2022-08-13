const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const createSendToken = async (user, statusCode, res) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_KEY, {
    expiresIn: process.env.JWT_ACCESS_KEY_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_KEY, {
    expiresIn: process.env.JWT_REFRESH_KEY_EXPIRES_IN,
  });
  // const cookieOptions = {
  //   expires: new Date(
  //     Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  //   ),
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === 'production',
  // };
  // res.cookie('jwt', accessToken, cookieOptions);
  const freshUser = await User.findById(user.id);
  const refreshArray = [...freshUser.refreshToken, refreshToken];
  freshUser.refreshToken = refreshArray;
  await freshUser.save();
  // user.refreshToken = refreshArray;
  // const result = await user.save();
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    accessToken,
    refreshToken,
    data: {
      user: freshUser,
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
  await createSendToken(newUser, 200, res);
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
  await createSendToken(user, 200, res);
};

exports.logout = async (req, res, next) => {
  res
    .status(200)
    // .clearCookie('jwt', {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    // })
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
    return res.status(401).json({ message: 'unauthorizded' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_KEY);
    const freshUser = await User.findById(decoded.id);
    req.user = freshUser;
    // res.locals.user = freshUser;
    next();
  } catch (err) {
    res.status(403).json({ err });
  }
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.body.token;
  const user = await User.findById(req.user.id);
  if (refreshToken == null) return res.sendStatus(401);
  if (!user.refreshToken.includes(refreshToken)) {
    return res.sendStatus(403);
  }
  jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, decoded) => {
    if (err) return res.sendStatus(403);
    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_ACCESS_KEY,
      {
        expiresIn: process.env.JWT_ACCESS_KEY_EXPIRES_IN,
      }
    );
    res.json({ accessToken });
  });
};
