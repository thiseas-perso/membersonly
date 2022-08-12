const express = require('express');

const router = express.Router();

router.route('/').get(postsController.getAllPosts);

module.exports = router;
