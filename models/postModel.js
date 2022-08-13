const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A post must have a title'],
    minlength: [5, 'Title min length is 5 chars'],
    maxlength: [20, 'Title max length is 40 chars'],
  },
  text: {
    type: String,
    required: [true, 'A post must have some text'],
    minlength: [5, 'Text min length is 5 chars'],
    maxlength: [500, 'Ttile max length is 500 chars'],
  },
  timestamp: {
    type: Date,
    default: Date.now(),
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A review must belong to a user'],
  },
});

module.exports = mongoose.model('Post', postSchema);
