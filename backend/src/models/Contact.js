const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, default: '' },
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'in_progress', 'resolved'], default: 'new' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', contactSchema);
