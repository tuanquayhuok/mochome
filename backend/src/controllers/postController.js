const Post = require('../models/Post');
const slugify = require('../utils/slugify');

const listPosts = async (req, res) => {
  const posts = await Post.find().sort('-createdAt');
  return res.json(posts);
};

const getPost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Không tìm thấy bài viết' });
  }
  return res.json(post);
};

const getInteractionStats = async (req, res) => {
  const posts = await Post.find()
    .select('title slug viewCount likeCount shareCount published isVisible createdAt thumbnail')
    .sort('-viewCount');

  const agg = await Post.aggregate([
    {
      $group: {
        _id: null,
        viewCount: { $sum: '$viewCount' },
        likeCount: { $sum: '$likeCount' },
        shareCount: { $sum: '$shareCount' }
      }
    }
  ]);

  const totals = agg[0] || { viewCount: 0, likeCount: 0, shareCount: 0 };

  return res.json({
    totals,
    posts
  });
};

const createPost = async (req, res) => {
  const { title, slug, excerpt, content, thumbnail, published, isVisible } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Tiêu đề và nội dung là bắt buộc' });
  }

  const finalSlug = slugify(slug || title);
  if (!finalSlug) {
    return res.status(400).json({ message: 'Slug không hợp lệ' });
  }

  const existing = await Post.findOne({ slug: finalSlug });
  if (existing) {
    return res.status(409).json({ message: 'Slug đã tồn tại' });
  }

  const post = await Post.create({
    title: title.trim(),
    slug: finalSlug,
    excerpt: excerpt || '',
    content,
    thumbnail: thumbnail || '',
    published: Boolean(published),
    isVisible: isVisible !== false,
    viewCount: Number(req.body.viewCount) || 0,
    likeCount: Number(req.body.likeCount) || 0,
    shareCount: Number(req.body.shareCount) || 0
  });

  return res.status(201).json(post);
};

const updatePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Không tìm thấy bài viết' });
  }

  const { title, slug, excerpt, content, thumbnail, published, isVisible, viewCount, likeCount, shareCount } =
    req.body;

  if (title) post.title = title.trim();
  if (excerpt !== undefined) post.excerpt = excerpt;
  if (content !== undefined) post.content = content;
  if (thumbnail !== undefined) post.thumbnail = thumbnail;
  if (typeof published === 'boolean') post.published = published;
  if (typeof isVisible === 'boolean') post.isVisible = isVisible;
  if (viewCount !== undefined) post.viewCount = Math.max(0, Number(viewCount) || 0);
  if (likeCount !== undefined) post.likeCount = Math.max(0, Number(likeCount) || 0);
  if (shareCount !== undefined) post.shareCount = Math.max(0, Number(shareCount) || 0);

  if (slug && slugify(slug) !== post.slug) {
    const finalSlug = slugify(slug);
    const existing = await Post.findOne({ slug: finalSlug, _id: { $ne: post._id } });
    if (existing) {
      return res.status(409).json({ message: 'Slug đã tồn tại' });
    }
    post.slug = finalSlug;
  } else if (title && !slug) {
    const fromTitle = slugify(title);
    if (fromTitle && fromTitle !== post.slug) {
      const existing = await Post.findOne({ slug: fromTitle, _id: { $ne: post._id } });
      if (!existing) post.slug = fromTitle;
    }
  }

  await post.save();
  return res.json(post);
};

const deletePost = async (req, res) => {
  const deleted = await Post.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Không tìm thấy bài viết' });
  }
  return res.json({ message: 'Đã xóa bài viết' });
};

module.exports = {
  listPosts,
  getPost,
  getInteractionStats,
  createPost,
  updatePost,
  deletePost
};
