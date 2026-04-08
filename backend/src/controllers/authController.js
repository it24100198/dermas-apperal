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
