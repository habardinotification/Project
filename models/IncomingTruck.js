const mongoose = require('mongoose');

const incomingTruckSchema = new mongoose.Schema({
  truck_number: { type: String, required: true, index: true },
  driver_name: { type: String, default: '' },
  detected_at: { type: Date, required: true },
  expected_arrival: { type: Date }, // وقت الوصول المتوقع = detected_at + 15 دقيقة
  status: { type: String, default: 'في الطريق' },
  source_email: { type: String, default: 'service2dmm@jibal.sa' },
  event: { type: String },
  location: { type: String },
  created_at: { type: Date, default: Date.now }
});

// منع التكرار: لا نضيف نفس السيارة خلال آخر ساعة (يمكن تعديل الفترة)
incomingTruckSchema.index({ truck_number: 1, detected_at: 1 }, { unique: true });

module.exports = mongoose.model('IncomingTruck', incomingTruckSchema);