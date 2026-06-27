const Product = require('../models/Product');
const Category = require('../models/Category');
const Post = require('../models/Post');
const PostComment = require('../models/PostComment');

const SOFA_PLACEHOLDER =
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80';

const mapPublicProduct = (product) => {
  const category = product.category || {};
  const images =
    product.images?.length > 0
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [SOFA_PLACEHOLDER];

  return {
    _id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: product.price,
    stock: product.stock,
    imageUrl: images[0],
    images,
    description: product.description || '',
    longDescription: product.longDescription || product.description || '',
    colors:
      product.colors?.length > 0
        ? product.colors
        : [
            { name: 'Xám', hex: '#9ca3af' },
            { name: 'Be', hex: '#d4b896' },
            { name: 'Nâu', hex: '#8b6914' }
          ],
    sizes: product.sizes?.length > 0 ? product.sizes : ['180cm', '200cm', '220cm'],
    material: product.material || 'Gỗ sồi tự nhiên, Nệm vải cao cấp',
    origin: product.origin || 'Việt Nam',
    detailSpecs:
      product.detailSpecs?.length > 0
        ? product.detailSpecs
        : [
            { label: 'Chất liệu', value: product.material || 'Gỗ sồi tự nhiên' },
            { label: 'Màu sắc', value: 'Xám / Be / Nâu' },
            { label: 'Kích thước', value: '180cm – 220cm' },
            { label: 'Xuất xứ', value: product.origin || 'Việt Nam' }
          ],
    careGuide:
      product.careGuide ||
      'Tránh ánh nắng trực tiếp và độ ẩm cao. Lau bụi bằng khăn mềm khô hàng tuần. Không dùng hóa chất mạnh lên bề mặt gỗ và vải bọc.',
    returnPolicy:
      product.returnPolicy ||
      'Đổi trả trong 7 ngày nếu sản phẩm lỗi từ nhà sản xuất. Khách hàng giữ nguyên tem, bao bì và hóa đơn mua hàng.',
    category: category._id
      ? { _id: category._id.toString(), name: category.name, slug: category.slug }
      : null,
    inStock: product.stock > 0
  };
};

const getProductBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isVisible: { $ne: false } }).populate('category', 'name slug');

  if (!product) {
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  }

  const categoryId = product.category?._id || product.category;
  const relatedFilter = categoryId
    ? { category: categoryId, _id: { $ne: product._id }, isVisible: { $ne: false } }
    : { _id: { $ne: product._id }, isVisible: { $ne: false } };

  const related = await Product.find(relatedFilter)
    .populate('category', 'name slug')
    .sort('-featured -createdAt')
    .limit(5);

  return res.json({
    product: mapPublicProduct(product),
    related: related.map(mapPublicProduct)
  });
};

const getCatalog = async (req, res) => {
  const [featured, products, categories, posts] = await Promise.all([
    Product.find({ featured: true, isVisible: { $ne: false } }).populate('category', 'name slug').sort('-createdAt').limit(8),
    Product.find({ isVisible: { $ne: false } }).populate('category', 'name slug').sort('-createdAt').limit(12),
    Category.find().sort('name'),
    Post.find({ published: true, isVisible: { $ne: false } })
      .sort('-createdAt')
      .limit(3)
      .select('title slug excerpt thumbnail viewCount likeCount')
  ]);

  const featuredList = featured.length ? featured : products.slice(0, 8);

  const withSlug = (list) =>
    list.map((p) => ({
      ...p.toObject(),
      slug: p.slug,
      inStock: p.stock > 0
    }));

  return res.json({
    featured: withSlug(featuredList),
    products: withSlug(products),
    categories,
    posts
  });
};

const getPostBySlug = async (req, res) => {
  const post = await Post.findOneAndUpdate(
    { slug: req.params.slug, isVisible: { $ne: false } },
    { $inc: { viewCount: 1 } },
    { new: true }
  );

  if (!post) {
    return res.status(404).json({ message: 'Không tìm thấy bài viết' });
  }

  return res.json(post);
};

const likePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Không tìm thấy bài viết' });
  }

  const userId = req.user._id;
  const isLiked = post.likes.includes(userId);

  if (isLiked) {
    post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
  } else {
    post.likes.push(userId);
  }

  post.likeCount = post.likes.length;
  await post.save();

  return res.json({
    likeCount: post.likeCount,
    isLiked: !isLiked
  });
};

const getPostComments = async (req, res) => {
  const comments = await PostComment.find({ post: req.params.id, isHidden: { $ne: true } })
    .populate('user', 'fullName email')
    .sort({ createdAt: 1 });

  return res.json(comments);
};

const createPostComment = async (req, res) => {
  const { content, parentId } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Nội dung bình luận không được trống' });
  }

  const comment = new PostComment({
    post: req.params.id,
    user: req.user._id,
    content: content.trim(),
    parentId: parentId || null
  });

  await comment.save();
  await comment.populate('user', 'fullName email');

  return res.status(201).json(comment);
};

const likePostComment = async (req, res) => {
  const comment = await PostComment.findById(req.params.id);
  if (!comment) {
    return res.status(404).json({ message: 'Không tìm thấy bình luận' });
  }

  const userId = req.user._id;
  const isLiked = comment.likes.includes(userId);

  if (isLiked) {
    comment.likes = comment.likes.filter((id) => id.toString() !== userId.toString());
  } else {
    comment.likes.push(userId);
  }

  await comment.save();
  await comment.populate('user', 'fullName email');

  return res.json(comment);
};

module.exports = {
  getCatalog,
  getProductBySlug,
  getPostBySlug,
  likePost,
  getPostComments,
  createPostComment,
  likePostComment
};
