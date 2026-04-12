import assert from 'node:assert/strict';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import 'dotenv/config';
import { User } from '../src/models/index.js';

const apiBaseURL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/manufacturing_erp';

const http = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
  validateStatus: () => true,
});

function logStep(message) {
  console.log(`\n[account-settings-validation-test] ${message}`);
}

function makeToken(userId) {
  assert.ok(process.env.JWT_SECRET, 'JWT_SECRET must be set in environment');
  return jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function assertValidationShape(response, expectedPaths = []) {
  assert.equal(response.status, 400, `Expected 400, got ${response.status}`);
  assert.equal(response.data?.error, 'Validation failed', `Expected validation error label, got ${response.data?.error}`);
  assert.ok(Array.isArray(response.data?.details), 'Expected details to be an array');
  assert.ok(response.data.details.length > 0, 'Expected at least one validation detail item');

  for (const detail of response.data.details) {
    assert.equal(typeof detail?.path, 'string', 'Each detail.path should be a string');
    assert.equal(typeof detail?.message, 'string', 'Each detail.message should be a string');
    assert.ok(detail.path.length > 0, 'Each detail.path should be non-empty');
    assert.ok(detail.message.length > 0, 'Each detail.message should be non-empty');
  }

  const actualPaths = new Set(response.data.details.map((d) => d.path));
  for (const path of expectedPaths) {
    assert.ok(actualPaths.has(path), `Expected validation details to include path "${path}", got [${[...actualPaths].join(', ')}]`);
  }
}

async function run() {
  logStep(`Using API base URL: ${apiBaseURL}`);
  logStep(`Using MongoDB URI: ${dbUri}`);

  await mongoose.connect(dbUri);

  let testUser = null;

  try {
    const stamp = Date.now();
    testUser = await User.create({
      name: 'Validation Contract User',
      email: `account.settings.validation.${stamp}@example.com`,
      password: 'StrongPass123',
      role: 'user',
      isActive: true,
    });

    const token = makeToken(testUser._id);
    const authHeaders = { Authorization: `Bearer ${token}` };

    logStep('1) Profile: missing required fields should return Validation failed with details paths');
    const profileMissingRes = await http.put('/account-settings/profile', {}, { headers: authHeaders });
    assertValidationShape(profileMissingRes, ['fullName', 'email', 'phone']);

    logStep('2) Profile: malformed values should return details with email and phone paths');
    const profileMalformedRes = await http.put(
      '/account-settings/profile',
      {
        fullName: 'X',
        email: 'not-an-email',
        phone: 'abc',
      },
      { headers: authHeaders }
    );
    assertValidationShape(profileMalformedRes, ['fullName', 'email', 'phone']);

    logStep('3) Password: wrong payload types should return details path consistency');
    const passwordTypeRes = await http.put(
      '/account-settings/password',
      {
        currentPassword: 123,
        newPassword: 456,
        confirmPassword: false,
      },
      { headers: authHeaders }
    );
    assertValidationShape(passwordTypeRes, ['currentPassword', 'newPassword', 'confirmPassword']);

    logStep('4) Preferences: missing and invalid types should return details path consistency');
    const preferencesInvalidRes = await http.put(
      '/account-settings/preferences',
      {
        emailNotifications: 'yes',
      },
      { headers: authHeaders }
    );
    assertValidationShape(preferencesInvalidRes, ['emailNotifications', 'systemAlerts', 'darkMode']);

    logStep('PASS: validation error payload contract is consistent for frontend mapping');
  } finally {
    if (testUser?._id) await User.deleteOne({ _id: testUser._id });
    await mongoose.disconnect();
  }
}

run()
  .then(() => {
    console.log('\n[account-settings-validation-test] PASS');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n[account-settings-validation-test] FAIL');
    console.error(error?.stack || error?.message || error);
    process.exit(1);
  });
