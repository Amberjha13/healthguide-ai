const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  userId: String,
  username: String,
  query: { type: String, required: true },
  hadDosageWarning: { type: Boolean, default: false },
  hadEmergencyFlag: { type: Boolean, default: false },
  toolsUsed: [String],
  timestamp: { type: Date, default: Date.now },
});

const Audit = mongoose.models.Audit || mongoose.model('Audit', auditSchema);

async function logAudit(data) {
  if (mongoose.connection.readyState !== 1) return;
  try {
    await Audit.create(data);
  } catch (err) {
    console.warn('[Audit] Failed to log:', err.message);
  }
}

module.exports = { logAudit, Audit };
