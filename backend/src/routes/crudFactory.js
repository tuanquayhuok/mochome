const express = require('express');
const asyncHandler = require('../utils/asyncHandler');

const createCrudRouter = (Model, options = {}) => {
  const router = express.Router();
  const populate = options.populate || '';
  const defaultSort = options.defaultSort || '-createdAt';

  router.get('/', asyncHandler(async (req, res) => {
    const data = await Model.find().populate(populate).sort(defaultSort);
    return res.json(data);
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    const item = await Model.findById(req.params.id).populate(populate);
    if (!item) {
      return res.status(404).json({ message: 'Not found' });
    }
    return res.json(item);
  }));

  router.post('/', asyncHandler(async (req, res) => {
    const created = await Model.create(req.body);
    return res.status(201).json(created);
  }));

  router.put('/:id', asyncHandler(async (req, res) => {
    const updated = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({ message: 'Not found' });
    }

    return res.json(updated);
  }));

  router.delete('/:id', asyncHandler(async (req, res) => {
    const deleted = await Model.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Not found' });
    }
    return res.json({ message: 'Deleted successfully' });
  }));

  return router;
};

module.exports = createCrudRouter;
