import * as authService from '../services/authService.js';

export async function login(req, res) {
  try {
    const { user, token } = await authService.login(req.body.email, req.body.password);
    return res.json({ user, token });
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
}

export async function me(req, res) {
  try {
    const user = await authService.getMe(req.user._id);
    return res.json(user);
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
}

export async function createRegistrationRequest(req, res) {
  try {
    const request = await authService.createRegistrationRequest(req.body);
    return res.status(201).json(request);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function register(req, res) {
  return createRegistrationRequest(req, res);
}

export async function listRegistrationRequests(req, res) {
  try {
    const rows = await authService.listRegistrationRequests(req.query.status);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getRegistrationRequestDetail(req, res) {
  try {
    const request = await authService.getRegistrationRequestDetail(req.params.id);
    return res.json(request);
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
}

export async function approveRegistrationRequest(req, res) {
  try {
    const request = await authService.approveRegistrationRequest(req.params.id, req.user._id, req.body);
    return res.json(request);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function rejectRegistrationRequest(req, res) {
  try {
    const request = await authService.rejectRegistrationRequest(req.params.id, req.user._id, req.body);
    return res.json(request);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function lookupRegistrationRequestStatus(req, res) {
  try {
    const result = await authService.lookupRegistrationRequestStatus(req.query.email, req.query.requestId);
    return res.json(result);
  } catch (err) {
    if (err.message === 'Invalid request ID') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(404).json({ error: err.message });
  }
}

export async function forgotPassword(req, res) {
  try {
    const result = await authService.forgotPassword(req.body.email);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.newPassword);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
