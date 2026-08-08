const Pickup = require("../models/Pickup");
const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const Inventory = require("../models/Inventory");
const ScrapItem = require("../models/ScrapItem");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

// Helper to get start and end of today
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// 1. Get Accounting Stats (Profit, Loss, Purchases, Sales)
const getAccountingStats = async (req, res) => {
  try {
    const { start, end } = getTodayRange();
    
    let pickupQuery = { status: "Completed" };
    let purchaseQuery = {};
    let saleQuery = {};

    if (req.user.role === "franchise") {
      pickupQuery.city = req.user.assignedCity;
      purchaseQuery.franchiseId = req.user._id;
      saleQuery.franchiseId = req.user._id;
    } else {
      // Admin sees everything (global overview)
      // No filter on franchiseId
    }

    // All Completed Pickups (App Purchases - Pending Procurement)
    const pendingPickups = await Pickup.find({...pickupQuery, isPurchasedByFranchise: false });
    const pendingProcurement = pendingPickups.reduce((acc, p) => acc + (p.amount || 0), 0);
    
    // Total gross value of all completed pickups
    const allPickups = await Pickup.find(pickupQuery);
    const totalCompletedPickupAmount = allPickups.reduce((acc, p) => acc + (p.amount || 0), 0);
    
    const todayPickups = allPickups.filter(p => new Date(p.updatedAt) >= start && new Date(p.updatedAt) <= end);
    const todayPickupAmount = todayPickups.reduce((acc, p) => acc + (p.amount || 0), 0);

    // All Manual Purchases
    const allPurchases = await Purchase.find(purchaseQuery);
    const totalPurchaseAmount = allPurchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const todayPurchases = allPurchases.filter(p => new Date(p.createdAt) >= start && new Date(p.createdAt) <= end);
    const todayPurchaseAmount = todayPurchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);

    // All Sales
    const allSalesData = await Sale.find(saleQuery);
    const totalSaleAmount = allSalesData.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const todaySales = allSalesData.filter(s => new Date(s.createdAt) >= start && new Date(s.createdAt) <= end);
    const todaySaleAmount = todaySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);

    // 1. NETWORK STATS (All franchises combined)
    const totalNetworkPurchase = allPurchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const totalNetworkSale = allSalesData.reduce((acc, s) => acc + (s.totalAmount || 0), 0);

    // 2. ADMIN-ONLY STATS
    const adminPurchases = allPurchases.filter(p => !p.franchiseId);
    const adminSales = allSalesData.filter(s => !s.franchiseId);
    const totalAdminPurchase = adminPurchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const totalAdminSale = adminSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);

    // 3. FRANCHISE STOCK VALUE
    const franchisePurchases = allPurchases.filter(p => p.franchiseId);
    const franchiseSales = allSalesData.filter(s => s.franchiseId);
    const franchiseTotalPurchase = franchisePurchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const franchiseTotalSale = franchiseSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const franchiseStockValue = Math.max(0, franchiseTotalPurchase - franchiseTotalSale);

    // Commission Earned by Admin
    let totalCommission = 0;
    let todayCommission = 0;
    
    const adminUser = await User.findOne({ role: "admin" }).select("_id");
    if (adminUser) {
      const commissionTxs = await WalletTransaction.find({
        user: adminUser._id,
        source: "commission",
        status: "completed",
        type: "credit"
      });
      totalCommission = commissionTxs.reduce((acc, tx) => acc + (tx.amount || 0), 0);
      const todayCommTxs = commissionTxs.filter(tx => new Date(tx.createdAt) >= start && new Date(tx.createdAt) <= end);
      todayCommission = todayCommTxs.reduce((acc, tx) => acc + (tx.amount || 0), 0);
    }

    // FINAL PROFIT CALCULATION
    let overallProfit = 0;
    let todayProfit = 0;

    if (req.user.role === "admin") {
      // Admin's profit = Admin's own sales - purchases (excluding commission for pure trading view)
      overallProfit = totalAdminSale - totalAdminPurchase;
      todayProfit = totalAdminSale - totalAdminPurchase; 
    } else {
      // Franchise's profit = Their own sales - purchases
      overallProfit = totalSaleAmount - totalPurchaseAmount;
      todayProfit = todaySaleAmount - todayPurchaseAmount;
    }

    // Determine what to return as primary stats
    const primaryPurchase = req.user.role === "admin" ? totalAdminPurchase : totalPurchaseAmount;
    const primarySale = req.user.role === "admin" ? totalAdminSale : totalSaleAmount;

    res.status(200).json({
      success: true,
      stats: {
        totalPurchaseAmount: primaryPurchase,
        totalSaleAmount: primarySale,
        overallProfit,
        todayProfit,
        totalCommission,
        todayCommission,
        totalNetworkPurchase,
        totalNetworkSale,
        pendingProcurement,
        totalCompletedPickupAmount,
        franchiseStockValue,
        stockValue: primaryPurchase - primarySale > 0 ? primaryPurchase - primarySale : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Inventory
const getInventory = async (req, res) => {
  try {
    const query = req.user.role === "franchise" ? { franchiseId: req.user._id } : { franchiseId: null };
    const inventory = await Inventory.find(query).populate("scrapItem", "name category unit image price");
    res.status(200).json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Sales
const getSales = async (req, res) => {
  try {
    const query = req.user.role === "franchise" ? { franchiseId: req.user._id } : { franchiseId: null };
    const sales = await Sale.find(query).populate("buyerId").sort({ createdAt: -1 });
    res.status(200).json({ success: true, sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Create Sale
const createSale = async (req, res) => {
  try {
    const saleData = req.body;

    if (!saleData.buyerName || !saleData.items || saleData.items.length === 0) {
      return res.status(400).json({ success: false, message: "Buyer name and items are required" });
    }

    const invoiceNumber = "INV-" + Date.now().toString().slice(-6);
    const franchiseId = req.user.role === "franchise" ? req.user._id : null;

    const newSale = await Sale.create({
      ...saleData,
      invoiceNumber,
      franchiseId,
      buyerId: saleData.buyerId || null
    });

    // Update Inventory
    for (const item of saleData.items) {
      if (item.scrapItem) {
        let inv = await Inventory.findOne({ scrapItem: item.scrapItem, franchiseId });
        if (inv) {
          inv.quantityAvailable = Math.max(0, inv.quantityAvailable - item.quantity);
          inv.totalSoldQuantity += item.quantity;
          await inv.save();
        }
      }
    }

    res.status(201).json({ success: true, message: "Sale recorded successfully", sale: newSale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Purchases
const getPurchases = async (req, res) => {
  try {
    const query = req.user.role === "franchise" ? { franchiseId: req.user._id } : { franchiseId: null };
    const purchases = await Purchase.find(query).populate("supplierId").sort({ createdAt: -1 });
    res.status(200).json({ success: true, purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5b. Edit Purchase (update items, notes, paymentStatus)
const editPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, notes, paymentStatus, paymentMethod, supplierName, supplierContact } = req.body;

    const purchase = await Purchase.findById(id);
    if (!purchase) return res.status(404).json({ success: false, message: "Purchase not found" });

    // Only allow admin or the franchise who created it
    if (req.user.role === "franchise" && String(purchase.franchiseId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized to edit this purchase" });
    }

    if (items && items.length > 0) {
      const totalAmount = items.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
      purchase.items = items;
      purchase.totalAmount = totalAmount;
    }
    if (notes !== undefined) purchase.notes = notes;
    if (paymentStatus) purchase.paymentStatus = paymentStatus;
    if (paymentMethod) purchase.paymentMethod = paymentMethod;
    if (supplierName) purchase.supplierName = supplierName;
    if (supplierContact) purchase.supplierContact = supplierContact;

    await purchase.save();
    res.status(200).json({ success: true, message: "Purchase updated successfully", purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5c. Get All Purchases By Supplier (for bill history view)
const getPurchasesBySupplier = async (req, res) => {
  try {
    const { supplierName, supplierContact } = req.query;
    const baseQuery = req.user.role === "franchise" ? { franchiseId: req.user._id } : { franchiseId: null };

    let query = { ...baseQuery };
    if (supplierName) query.supplierName = { $regex: supplierName, $options: "i" };
    if (supplierContact) query.supplierContact = supplierContact;

    const purchases = await Purchase.find(query).populate("supplierId").sort({ createdAt: -1 });
    const totalAmount = purchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    res.status(200).json({ success: true, purchases, totalAmount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



const createPurchase = async (req, res) => {
  try {
    const { supplierName, supplierContact, items, totalAmount, paymentStatus, paymentMethod, notes } = req.body;

    if (!supplierName || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Supplier name and items are required" });
    }

    const franchiseId = req.user.role === "franchise" ? req.user._id : null;
    const collector = req.body.supplierId ? await User.findById(req.body.supplierId) : null;

    // ─────────────────────────────────────────────────────
    // SMART SETTLEMENT: If collector has a negative balance,
    // that debt settles first (covers franchise refund + commission)
    // Remaining balance can be UPI/Cash — no wallet needed.
    // ─────────────────────────────────────────────────────
    let autoSettleAmount = 0; // Amount covered by collector's debt
    let freshWalletDebit = totalAmount; // Amount franchise actually needs to pay fresh

    if (collector && collector.walletBalance < 0) {
      // How much debt can be settled (capped at totalAmount)
      autoSettleAmount = Math.min(Math.abs(collector.walletBalance), totalAmount);
      freshWalletDebit = totalAmount - autoSettleAmount;
    }

    // PRE-CHECK: Only need fresh wallet funds for the remaining portion
    if (paymentMethod === "Cash Wallet" && paymentStatus === "Paid" && franchiseId) {
      const franchise = await User.findById(franchiseId);
      const currentBalance = franchise ? franchise.walletBalance : 0;
      if (currentBalance < freshWalletDebit) {
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. Fresh payment needed: ₹${freshWalletDebit} (₹${autoSettleAmount} covered by collector debt). Available: ₹${currentBalance}`
        });
      }
    }

    const newPurchase = await Purchase.create({
      supplierName,
      supplierContact,
      items,
      totalAmount,
      paymentStatus,
      paymentMethod,
      franchiseId,
      supplierId: req.body.supplierId || null,
      notes: req.body.pickupId ? `Converted from Pickup #${req.body.pickupId.slice(-6)}. ${notes || ""}` : notes
    });

    // Link and mark pickup as purchased if pickupId is provided
    if (req.body.pickupId) {
      await Pickup.findByIdAndUpdate(req.body.pickupId, { isPurchasedByFranchise: true });
    }

    // Update Inventory (Increase Stock)
    for (const item of items) {
      if (item.scrapItem) {
        let inv = await Inventory.findOne({ scrapItem: item.scrapItem, franchiseId });
        if (!inv) {
          inv = new Inventory({ scrapItem: item.scrapItem, franchiseId, quantityAvailable: 0, totalBoughtQuantity: 0, totalSoldQuantity: 0 });
        }
        inv.quantityAvailable += parseFloat(item.quantity) || 0;
        inv.totalBoughtQuantity += parseFloat(item.quantity) || 0;
        await inv.save();
      }
    }

    // ─────────────────────────────────────────────────────
    // WALLET SETTLEMENT LOGIC
    // Step 1: Settle collector's debt → refund franchise + clear commission
    // Step 2: Debit fresh wallet funds if payment is via App Wallet
    // ─────────────────────────────────────────────────────
    if (collector && franchiseId) {
      const franchise = await User.findById(franchiseId);

      if (franchise) {
        // STEP 1: Auto-Settle collector's negative balance
        if (autoSettleAmount > 0) {
          // Clear collector's debt
          collector.walletBalance += autoSettleAmount;

          // Refund franchise for the pickup amount they pre-funded
          // (Commission was taken from collector directly, franchise paid only user payout)
          // We refund up to what franchise actually paid (pickup.amount)
          let franchiseRefund = autoSettleAmount;
          if (req.body.pickupId) {
            const pickup = await Pickup.findById(req.body.pickupId);
            if (pickup) {
              // Franchise only funded the user payout, not the commission
              franchiseRefund = Math.min(autoSettleAmount, pickup.amount || 0);
            }
          }

          if (franchiseRefund > 0) {
            franchise.walletBalance += franchiseRefund;
            await WalletTransaction.create({
              user: franchise._id,
              amount: franchiseRefund,
              type: "credit",
              status: "completed",
              description: `Auto-Settle Refund: Pickup cost recovery (₹${franchiseRefund})`,
              source: "refund",
              referenceId: newPurchase._id
            });
            console.log(`[SETTLEMENT] ₹${franchiseRefund} refunded to Franchise ${franchise.name}`);
          }

          await WalletTransaction.create({
            user: collector._id,
            amount: autoSettleAmount,
            type: "credit",
            status: "completed",
            description: `Debt Settled: ₹${autoSettleAmount} cleared via Purchase settlement`,
            source: "settlement",
            referenceId: newPurchase._id
          });
        }

        // STEP 2: Handle remaining fresh payment
        if (paymentMethod === "Cash Wallet" && paymentStatus === "Paid" && freshWalletDebit > 0) {
          // Debit fresh amount from franchise
          franchise.walletBalance -= freshWalletDebit;
          // Credit fresh amount to collector
          collector.walletBalance += freshWalletDebit;

          await WalletTransaction.create({
            user: franchise._id,
            amount: freshWalletDebit,
            type: "debit",
            status: "completed",
            description: `Purchase Payment to ${supplierName} (App Wallet)`,
            source: "purchase",
            referenceId: newPurchase._id
          });

          await WalletTransaction.create({
            user: collector._id,
            amount: freshWalletDebit,
            type: "credit",
            status: "completed",
            description: `Payment received from ${franchise.name} (App Wallet)`,
            source: "sale",
            referenceId: newPurchase._id
          });
        } else if ((paymentMethod === "UPI" || paymentMethod === "Cash") && freshWalletDebit > 0) {
          // Paid outside the app — just log it, no wallet debit from franchise
          await WalletTransaction.create({
            user: collector._id,
            amount: freshWalletDebit,
            type: "credit",
            status: "paid_in_cash",
            description: `₹${freshWalletDebit} paid via ${paymentMethod} (outside app)`,
            source: "sale",
            referenceId: newPurchase._id
          });
        }

        await franchise.save();
        await collector.save();
      }
    }

    // Send Instant WhatsApp & SMS Purchase Receipt to Collector / Supplier
    try {
      const { sendCollectorPurchaseReceiptNotification } = require("../utils/notifier");
      const targetPhone = collector?.mobile || supplierContact;
      const targetName = collector?.name || supplierName;
      if (targetPhone) {
        await sendCollectorPurchaseReceiptNotification({
          collectorMobile: targetPhone,
          collectorName: targetName,
          invoiceNo: newPurchase._id.toString().slice(-6).toUpperCase(),
          items: newPurchase.items,
          totalAmount: newPurchase.totalAmount,
          paymentStatus: newPurchase.paymentStatus,
          autoSettleAmount
        });
      }
    } catch (notifErr) {
      console.log("Collector purchase notification note:", notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: `Purchase recorded! Auto-settled: ₹${autoSettleAmount}. Fresh payment: ₹${freshWalletDebit} via ${paymentMethod}.`,
      purchase: newPurchase,
      settlement: { autoSettleAmount, freshWalletDebit }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAccountingStats,
  getInventory,
  getSales,
  createSale,
  getPurchases,
  createPurchase,
  editPurchase,
  getPurchasesBySupplier
};
