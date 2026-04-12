import assert from 'node:assert/strict';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import 'dotenv/config';
import { Employee, User } from '../src/models/index.js';

const apiBaseURL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/manufacturing_erp';

const http = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
  validateStatus: () => true,
});

function logStep(message) {
  console.log(`\n[next-employee-id-test] ${message}`);
}

async function ensureAdminUser() {
  const existing = await User.findOne({ role: 'admin', isActive: true });
  if (existing) return existing;

  return User.create({
    name: 'Integration Admin',
    email: `integration.admin.${Date.now()}@example.com`,
    password: 'StrongPass123',
    role: 'admin',
    isActive: true,
  });
}

function makeToken(userId) {
  assert.ok(process.env.JWT_SECRET, 'JWT_SECRET must be set in environment');
  return jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

async function run() {
  logStep(`Using API base URL: ${apiBaseURL}`);
  logStep(`Using MongoDB URI: ${dbUri}`);

  await mongoose.connect(dbUri);

  let tempAdmin = null;
  let tempUser = null;
  let tempEmployee = null;

  try {
    const admin = await ensureAdminUser();
    if (String(admin.email).startsWith('integration.admin.')) tempAdmin = admin;

    const nonAdmin = await User.create({
      name: 'Integration Operator',
      email: `integration.operator.${Date.now()}@example.com`,
      password: 'StrongPass123',
      role: 'user',
      isActive: true,
    });
    tempUser = nonAdmin;

    const highNumber = Date.now();
    const highCode = `EMP-${highNumber}`;
    tempEmployee = await Employee.create({
      userId: nonAdmin._id,
      employeeId: highCode,
      role: 'operator',
      name: nonAdmin.name,
      phone: '+94770000000',
    });

    const adminToken = makeToken(admin._id);
    const userToken = makeToken(nonAdmin._id);

    logStep('1) No token should return 401');
    const unauthRes = await http.get('/account-requests/next-employee-id');
    assert.equal(unauthRes.status, 401, `Expected 401, got ${unauthRes.status}`);

    logStep('2) Non-admin token should return 403');
    const userRes = await http.get('/account-requests/next-employee-id', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.equal(userRes.status, 403, `Expected 403, got ${userRes.status}`);

    logStep('3) Admin token should return next employee ID from latest value');
    const adminRes = await http.get('/account-requests/next-employee-id', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(adminRes.status, 200, `Expected 200, got ${adminRes.status}: ${JSON.stringify(adminRes.data)}`);
    assert.ok(adminRes.data?.employeeId, 'Expected response to include employeeId');
    assert.match(adminRes.data.employeeId, /^EMP-\d+$/, 'Expected employeeId format EMP-<digits>');

    const expectedNext = `EMP-${highNumber + 1}`;
    assert.equal(
      adminRes.data.employeeId,
      expectedNext,
      `Expected next employeeId ${expectedNext}, got ${adminRes.data.employeeId}`
    );

    logStep('PASS: endpoint auth and next-id behavior verified');
  } finally {
    if (tempEmployee?._id) await Employee.deleteOne({ _id: tempEmployee._id });
    if (tempUser?._id) await User.deleteOne({ _id: tempUser._id });
    if (tempAdmin?._id) await User.deleteOne({ _id: tempAdmin._id });
    await mongoose.disconnect();
  }
}

run()
  .then(() => {
    console.log('\n[next-employee-id-test] PASS');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n[next-employee-id-test] FAIL');
    console.error(error?.stack || error?.message || error);
    process.exit(1);
  });
