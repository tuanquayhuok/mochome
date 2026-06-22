/** Bắt lỗi async trong route Express và chuyển sang error middleware. */
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
