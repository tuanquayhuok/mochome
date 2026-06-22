const express = require('express');
const {
  listPosts,
  getPost,
  getInteractionStats,
  createPost,
  updatePost,
  deletePost
} = require('../controllers/postController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/stats/interactions', asyncHandler(getInteractionStats));
router.get('/', asyncHandler(listPosts));
router.get('/:id', asyncHandler(getPost));
router.post('/', asyncHandler(createPost));
router.put('/:id', asyncHandler(updatePost));
router.delete('/:id', asyncHandler(deletePost));

module.exports = router;
