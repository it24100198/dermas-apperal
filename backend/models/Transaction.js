const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required."],
      index: true,
    },
    productName: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
      maxlength: [120, "Product name cannot exceed 120 characters."],
    },
    type: {
      type: String,
      required: [true, "Transaction type is required."],
      enum: {
        values: ["in", "out"],
        message: "Transaction type must be either 'in' or 'out'.",
      },
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required."],
      min: [1, "Quantity must be at least 1."],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer.",
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, "Notes cannot exceed 300 characters."],
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;

        if (ret.product) {
          ret.productId = ret.product.toString();
        }

        delete ret.product;
        return ret;
      },
    },
  }
);

transactionSchema.index({ date: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
