import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const registerRequestSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().trim().min(7).max(25).required(),
  password: Joi.string().min(8).required(),
  requestedDepartment: Joi.string().trim().max(120).allow('').optional(),
  reasonForAccess: Joi.string().trim().max(500).allow('').optional(),
  acceptTerms: Joi.boolean().valid(true).required(),
});

export const approveRegistrationSchema = Joi.object({
  employeeId: Joi.string().trim().max(40).allow('').optional(),
  role: Joi.string().valid('operator', 'line_supervisor', 'washing_supervisor', 'cutting_supervisor', 'admin').required(),
  productionSectionId: Joi.string().allow('', null).optional(),
});

export const rejectRegistrationSchema = Joi.object({
  rejectionReason: Joi.string().trim().max(500).allow('').optional(),
});

export const registrationStatusLookupSchema = Joi.object({
  email: Joi.string().email().required(),
  requestId: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});
