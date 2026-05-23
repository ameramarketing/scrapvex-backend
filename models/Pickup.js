// models/Pickup.js

const mongoose = require("mongoose");

const pickupSchema =
  new mongoose.Schema(
    {
      user: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },

      collector: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },

      name: {
        type: String,
        required: true,
        trim: true
      },

      mobile: {
        type: String,
        required: true,
        trim: true
      },

      email: {
        type: String,
        default: ""
      },

      address: {
        type: String,
        required: true
      },

      city: {
        type: String,
        required: true
      },

      pincode: {
        type: Number,
        required: true
      },

      scrapType: {
        type: String,
        required: true
      },

      weight: {
        type: Number,
        default: 0
      },

      amount: {
        type: Number,
        default: 0
      },

      pickupDate: {
        type: Date,
        default: Date.now
      },

      pickupTime: {
        type: String,
        default: ""
      },

      notes: {
        type: String,
        default: ""
      },

      items: {
        type: Array,
        default: []
      },
      isReviewed: {
        type: Boolean,
        default: false
      },
      status: {
        type: String,
        enum: [
          "Pending",
          "Assigned",
          "Accepted",
          "On The Way",
          "Completed",
          "Cancelled",
          "Rejected"
        ],
        default: "Pending"
      },
      verificationCode: {
        type: String,
        default: null
      },
      isPurchasedByFranchise: {
        type: Boolean,
        default: false
      }
    },
    {
      timestamps: true
    }
  );

module.exports =
  mongoose.model(
    "Pickup",
    pickupSchema
  );