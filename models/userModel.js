const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: [true, 'A user must have a first name'],
    },
    lastName: {
      type: String,
      trim: true,
      required: [true, 'A user must have a last name'],
    },
    email: {
      type: String,
      trim: true,
      required: [true, 'A user must have an email'],
      unique: true,
      lowercase: true,
      validete: [validator.isEmail, 'Provide a valid email'],
    },
    password: {
      type: String,
      trim: true,
      required: [true, 'A user must have a pawwsord'],
      minLength: 3,
      select: false,
    },
    passwordConfirm: {
      type: String,
      trim: true,
      required: [true, 'Please confirm your password'],
      //NOTE: the validator only works on SAVE and CREATE but not on UPDATE!!
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwsord must match',
      },
      select: false,
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

//virtual
userSchema.virtual('fullname').get(function () {
  return `${this.lastName}, ${this.firstName}`;
});

//schema middleware that runs before saving to the database
//When we create a new user, the password is converted to hash and salt using bcryptjs.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

//adding static methods on the User schema
userSchema.methods.correctPassword = async function (candidatePwd, userPwd) {
  return await bcrypt.compare(candidatePwd, userPwd);
};

module.exports = mongoose.model('User', userSchema);
