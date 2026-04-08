const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
      maxlength: [120, "Product name cannot exceed 120 characters."],
    },
    category: {
      type: String,
      required: [true, "Category is required."],
      trim: true,
      maxlength: [60, "Category cannot exceed 60 characters."],
    },
    size: {
      type: String,
      required: [true, "Size is required."],
      trim: true,
      maxlength: [20, "Size cannot exceed 20 characters."],
    },
    color: {
      type: String,
      required: [true, "Color is required."],
      trim: true,
      maxlength: [40, "Color cannot exceed 40 characters."],
    },
    price: {
      type: Number,
      required: [true, "Price is required."],
      min: [0, "Price cannot be negative."],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required."],
      min: [0, "Quantity cannot be negative."],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer.",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters."],
      default: "",
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
        return ret;
      },
    },
  }
);

productSchema.index({ name: "text", color: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
