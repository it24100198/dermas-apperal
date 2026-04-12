import assert from 'node:assert/strict';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import 'dotenv/config';
import { Employee, ProductionSection, User } from '../src/models/index.js';

const apiBaseURL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/manufacturing_erp';

const http = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
  validateStatus: () => true,
});

function logStep(message) {
  console.log(`\n[account-settings-test] ${message}`);
}

function makeToken(userId) {
  assert.ok(process.env.JWT_SECRET, 'JWT_SECRET must be set in environment');
  return jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

async function run() {
  logStep(`Using API base URL: ${apiBaseURL}`);
  logStep(`Using MongoDB URI: ${dbUri}`);

  await mongoose.connect(dbUri);

  let testUser = null;
  let secondUser = null;
  let testEmployee = null;
  let testSection = null;

  try {
    const stamp = Date.now();

    testUser = await User.create({
      name: 'Account Settings User',
      email: `account.settings.${stamp}@example.com`,
      password: 'StrongPass123',
      role: 'user',
      isActive: true,
    });

    secondUser = await User.create({
      name: 'Duplicate Email User',
      email: `duplicate.settings.${stamp}@example.com`,
      password: 'StrongPass123',
      role: 'user',
      isActive: true,
    });

    testSection = await ProductionSection.create({
      name: `Quality Assurance ${stamp}`,
      slug: `qa-${stamp}`,
      type: 'department',
    });

    testEmployee = await Employee.create({
      userId: testUser._id,
      employeeId: `EMP-${stamp}`,
      productionSectionId: testSection._id,
      role: 'line_supervisor',
      name: testUser.name,
      phone: '+94771234567',
    });

    const token = makeToken(testUser._id);

    logStep('1) GET /account-settings/me without token should return 401');
    const unauthMe = await http.get('/account-settings/me');
    assert.equal(unauthMe.status, 401, `Expected 401, got ${unauthMe.status}`);

    logStep('2) GET /account-settings/me with token should return expected contract');
    const meRes = await http.get('/account-settings/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(meRes.status, 200, `Expected 200, got ${meRes.status}`);
    assert.equal(meRes.data?.data?.email, testUser.email);
    assert.equal(meRes.data?.data?.employeeId, testEmployee.employeeId);
    assert.equal(meRes.data?.data?.department, testSection.name);
    assert.equal(typeof meRes.data?.data?.preferences?.emailNotifications, 'boolean');
    assert.equal(typeof meRes.data?.data?.preferences?.systemAlerts, 'boolean');
    assert.equal(typeof meRes.data?.data?.preferences?.darkMode, 'boolean');

    logStep('3) PUT /account-settings/profile invalid phone should return 400');
    const invalidPhoneRes = await http.put(
      '/account-settings/profile',
      {
        fullName: 'Updated Name',
        email: testUser.email,
        phone: 'abc',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    assert.equal(invalidPhoneRes.status, 400, `Expected 400, got ${invalidPhoneRes.status}`);

    logStep('4) PUT /account-settings/profile duplicate email should return 409');
    const duplicateEmailRes = await http.put(
      '/account-settings/profile',
      {
        fullName: 'Updated Name',
        email: secondUser.email,
        phone: '+94771234567',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    assert.equal(duplicateEmailRes.status, 409, `Expected 409, got ${duplicateEmailRes.status}`);

    logStep('5) PUT /account-settings/profile success should persist values');
    const newEmail = `updated.settings.${stamp}@example.com`;
    const profileRes = await http.put(
      '/account-settings/profile',
      {
        fullName: 'Updated Settings Name',
        email: newEmail,
        phone: '+94770011223',
        profilePhoto: 'https://example.com/avatar.png',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    assert.equal(profileRes.status, 200, `Expected 200, got ${profileRes.status}`);

    const userAfterProfile = await User.findById(testUser._id).lean();
    const employeeAfterProfile = await Employee.findById(testEmployee._id).lean();
    assert.equal(userAfterProfile?.email, newEmail);
    assert.equal(userAfterProfile?.name, 'Updated Settings Name');
    assert.equal(userAfterProfile?.phone, '+94770011223');
    assert.equal(employeeAfterProfile?.name, 'Updated Settings Name');
    assert.equal(employeeAfterProfile?.phone, '+94770011223');

    logStep('6) PUT /account-settings/password with empty payload should skip change with 200');
    const noChangePasswordRes = await http.put(
      '/account-settings/password',
      {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    assert.equal(noChangePasswordRes.status, 200, `Expected 200, got ${noChangePasswordRes.status}`);

    logStep('7) PUT /account-settings/password wrong current password should return 400');
    const wrongCurrentRes = await http.put(
      '/account-settings/password',
      {
        currentPassword: 'WrongPass123',
        newPassword: 'NewStrongPass123',
        confirmPassword: 'NewStrongPass123',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    assert.equal(wrongCurrentRes.status, 400, `Expected 400, got ${wrongCurrentRes.status}`);

    logStep('8) PUT /account-settings/password mismatch should return 400');
    const mismatchRes = await http.put(
      '/account-settings/password',
      {
        currentPassword: 'StrongPass123',
        newPassword: 'NewStrongPass123',
        confirmPassword: 'Mismatch123',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    assert.equal(mismatchRes.status, 400, `Expected 400, got ${mismatchRes.status}`);

    logStep('9) PUT /account-settings/password success should hash and persist');
    const passwordRes = await http.put(
      '/account-settings/password',
      {
        currentPassword: 'StrongPass123',
        newPassword: 'NewStrongPass123',
        confirmPassword: 'NewStrongPass123',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    assert.equal(passwordRes.status, 200, `Expected 200, got ${passwordRes.status}`);

    const userWithPassword = await User.findById(testUser._id).select('+password');
    const matchesNewPassword = await userWithPassword.comparePassword('NewStrongPass123');
    assert.equal(matchesNewPassword, true, 'Expected persisted password to match new password');

    logStep('10) PUT /account-settings/preferences invalid type should return 400');
    const invalidPrefRes = await http.put(
      '/account-settings/preferences',
      {
        emailNotifications: 'yes',
        systemAlerts: true,
        darkMode: false,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    assert.equal(invalidPrefRes.status, 400, `Expected 400, got ${invalidPrefRes.status}`);

    logStep('11) PUT /account-settings/preferences success and verify GET reflects changes');
    const prefRes = await http.put(
      '/account-settings/preferences',
      {
        emailNotifications: false,
        systemAlerts: false,
        darkMode: true,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    assert.equal(prefRes.status, 200, `Expected 200, got ${prefRes.status}`);

    const meAfterPrefsRes = await http.get('/account-settings/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(meAfterPrefsRes.status, 200, `Expected 200, got ${meAfterPrefsRes.status}`);
    assert.equal(meAfterPrefsRes.data?.data?.preferences?.emailNotifications, false);
    assert.equal(meAfterPrefsRes.data?.data?.preferences?.systemAlerts, false);
    assert.equal(meAfterPrefsRes.data?.data?.preferences?.darkMode, true);

    logStep('PASS: account-settings endpoints validated');
  } finally {
    if (testEmployee?._id) await Employee.deleteOne({ _id: testEmployee._id });
    if (testSection?._id) await ProductionSection.deleteOne({ _id: testSection._id });
    if (testUser?._id) await User.deleteOne({ _id: testUser._id });
    if (secondUser?._id) await User.deleteOne({ _id: secondUser._id });
    await mongoose.disconnect();
  }
}

run()
  .then(() => {
    console.log('\n[account-settings-test] PASS');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n[account-settings-test] FAIL');
    console.error(error?.stack || error?.message || error);
    process.exit(1);
  });
