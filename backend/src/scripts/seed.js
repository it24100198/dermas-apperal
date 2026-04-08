import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  User,
  Employee,
  ProductionSection,
  Material,
  Product,
  ManufacturingJob,
  MaterialIssue,
  JobLineAssignment,
  HourlyProduction,
  WashingTransfer,
  QcCheck,
  PackingBatch,
  StockLedger,
} from '../models/index.js';
import { JOB_STATUS } from '../utils/statusMachine.js';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/manufacturing_erp');

  await StockLedger.deleteMany({});
  await PackingBatch.deleteMany({});
  await QcCheck.deleteMany({});
  await WashingTransfer.deleteMany({});
  await HourlyProduction.deleteMany({});
  await JobLineAssignment.deleteMany({});
  await MaterialIssue.deleteMany({});
  await ManufacturingJob.deleteMany({});
  await Product.deleteMany({});
  await Material.deleteMany({});
  await Employee.deleteMany({});
  await ProductionSection.deleteMany({});
  await User.deleteMany({});

  const hashed = (pwd) => bcrypt.hashSync(pwd, 10);
  const users = await User.insertMany([
    { email: 'admin@demo.com', password: hashed('admin123'), name: 'Admin User', role: 'admin' },
    { email: 'cutting@demo.com', password: hashed('cut123'), name: 'Cutting Supervisor', role: 'supervisor' },
    { email: 'washing@demo.com', password: hashed('wash123'), name: 'Washing Supervisor', role: 'supervisor' },
    { email: 'line01@demo.com', password: hashed('line123'), name: 'Line 01 Supervisor', role: 'supervisor' },
    { email: 'user@demo.com', password: hashed('user123'), name: 'Operator', role: 'user' },
  ]);

  const sections = await ProductionSection.insertMany([
    { name: 'Cutting', slug: 'cutting', type: 'department', isActive: true },
    { name: 'Washing', slug: 'washing', type: 'department', isActive: true },
    { name: 'Finishing', slug: 'finishing', type: 'department', isActive: true },
    { name: 'Line 01', slug: 'line-01', type: 'line', isActive: true },
    { name: 'Line 02', slug: 'line-02', type: 'line', isActive: true },
  ]);

  const cuttingSection = sections.find((s) => s.slug === 'cutting');
  const washingSection = sections.find((s) => s.slug === 'washing');
  const line01 = sections.find((s) => s.slug === 'line-01');

  const employees = await Employee.insertMany([
    { userId: users[0]._id, role: 'admin', name: 'Admin User' },
    { userId: users[1]._id, productionSectionId: cuttingSection._id, role: 'cutting_supervisor', name: 'Cutting Supervisor' },
    { userId: users[2]._id, productionSectionId: washingSection._id, role: 'washing_supervisor', name: 'Washing Supervisor' },
    { userId: users[3]._id, productionSectionId: line01._id, role: 'line_supervisor', name: 'Line 01 Supervisor' },
    { userId: users[4]._id, role: 'operator', name: 'Operator' },
  ]);

  await Material.insertMany([
    { name: 'Cotton Fabric White', type: 'fabric', stockQty: 5000, unit: 'm' },
    { name: 'Zipper #5', type: 'accessory', stockQty: 2000, unit: 'pcs' },
    { name: 'Buttons Set A', type: 'accessory', stockQty: 5000, unit: 'pcs' },
  ]);

  const sampleProduct = await Product.create({
    name: 'Sample T-Shirt',
    sku: 'TSH-001',
    classification: 'normal',
    status: 'active',
    stockQty: 0,
  });

  await ManufacturingJob.create({
    jobNumber: 'JOB-2025-0001',
    styleRef: 'STYLE-A',
    batchRef: 'BATCH-001',
    issuedFabricQuantity: 100,
    status: JOB_STATUS.FABRIC_ISSUED,
    createdBy: users[0]._id,
  });

  console.log('Seed completed. Users: admin@demo.com / admin123, washing@demo.com / wash123, etc.');
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
