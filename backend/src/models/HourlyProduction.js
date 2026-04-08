import mongoose from 'mongoose';

const hourlyProductionSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'ManufacturingJob', required: true },
    lineName: { type: String, required: true },
    productionDate: { type: String, required: true }, // YYYY-MM-DD
    hour: { type: Number, required: true, min: 0, max: 23 },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    quantity: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

hourlyProductionSchema.index(
  { jobId: 1, lineName: 1, productionDate: 1, hour: 1, employeeId: 1 },
  { unique: true }
);

export default mongoose.model('HourlyProduction', hourlyProductionSchema);
