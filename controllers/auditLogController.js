const AuditLog = require("../models/AuditLog");

const logAction = async (performedBy, action, module, details, req) => {
  try {
    await AuditLog.create({
      performedBy,
      action,
      module,
      details,
      ipAddress: req?.ip || "unknown",
      userAgent: req?.get("User-Agent") || "unknown"
    });
  } catch (error) {
    console.error("AuditLog Error:", error.message);
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const query = {};
    if (req.query.module) query.module = req.query.module;
    if (req.query.action) query.action = req.query.action;

    const logs = await AuditLog.find(query)
      .populate("performedBy", "name role")
      .sort({ createdAt: -1 })
      .limit(200);
    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { logAction, getAuditLogs };
