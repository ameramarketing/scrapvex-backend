const express = require("express");
const router = express.Router();
const { getTickets, createTicket, replyToTicket, updateTicketStatus, deleteTicket } = require("../controllers/supportTicketController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, getTickets);
router.post("/", protect, createTicket);
router.post("/:id/reply", protect, replyToTicket);
router.put("/:id/status", protect, authorize("admin", "franchise"), updateTicketStatus);
router.delete("/:id", protect, authorize("admin"), deleteTicket);

module.exports = router;
