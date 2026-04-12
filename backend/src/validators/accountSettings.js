import Joi from 'joi';

const phonePattern = /^\+?[0-9()\-\s]{7,20}$/;

export const updateAccountProfileSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().pattern(phonePattern).required(),
  profilePhoto: Joi.string().trim().allow('').uri({ scheme: ['http', 'https'] }).optional(),
});

export const updateAccountPasswordSchema = Joi.object({
  currentPassword: Joi.string().allow('').optional(),
  newPassword: Joi.string().min(8).allow('').optional(),
  confirmPassword: Joi.string().allow('').optional(),
});

export const updateAccountPreferencesSchema = Joi.object({
  emailNotifications: Joi.boolean().required(),
  systemAlerts: Joi.boolean().required(),
  darkMode: Joi.boolean().required(),
});
