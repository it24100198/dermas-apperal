import * as yup from 'yup'
import { PAYMENT_METHODS, RECURRING_FREQUENCY, USER_ROLES } from './constants'

export const registerSchema = yup.object({
	firstName: yup.string().required('First name is required'),
	lastName: yup.string().required('Last name is required'),
	email: yup.string().email('Please enter a valid email').required('Email is required'),
	password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
	confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
	phone: yup.string().required('Phone is required'),
	department: yup.string().required('Department is required'),
	role: yup.string().oneOf(Object.values(USER_ROLES), 'Please select a valid role').required('Role is required')
})

export const loginSchema = yup.object({
	email: yup.string().email('Please enter a valid email').required('Email is required'),
	password: yup.string().required('Password is required')
})

export const expenseSchema = yup.object({
	title: yup.string().trim().required('Title is required'),
	amount: yup.number().typeError('Amount must be a number').positive('Amount must be greater than zero').required('Amount is required'),
	category: yup.string().required('Category is required'),
	subCategory: yup.string().nullable(),
	vendor: yup.string().nullable(),
	department: yup.string().required('Department is required'),
	paymentMethod: yup.string().oneOf(Object.values(PAYMENT_METHODS)).required('Payment method is required'),
	date: yup.string().required('Date is required'),
	description: yup.string().nullable()
})

export const employeeSchema = yup.object({
	employeeCode: yup.string().required('Employee code is required'),
	firstName: yup.string().required('First name is required'),
	lastName: yup.string().required('Last name is required'),
	email: yup.string().email('Please enter a valid email').required('Email is required'),
	phone: yup.string().required('Phone is required'),
	department: yup.string().required('Department is required'),
	designation: yup.string().required('Designation is required'),
	joiningDate: yup.string().required('Joining date is required'),
	salary: yup.number().typeError('Salary must be a number').min(0).required('Salary is required')
})

export const reimbursementSchema = yup.object({
	expenseTitle: yup.string().required('Expense title is required'),
	category: yup.string().required('Category is required'),
	amount: yup.number().typeError('Amount must be a number').positive('Amount must be greater than zero').required('Amount is required'),
	description: yup.string().required('Description is required'),
	expenseDate: yup.string().required('Expense date is required')
})

export const recurringExpenseSchema = yup.object({
	title: yup.string().required('Title is required'),
	amount: yup.number().typeError('Amount must be a number').positive('Amount must be greater than zero').required('Amount is required'),
	category: yup.string().required('Category is required'),
	department: yup.string().required('Department is required'),
	paymentMethod: yup.string().oneOf(Object.values(PAYMENT_METHODS)).required('Payment method is required'),
	frequency: yup.string().oneOf(Object.values(RECURRING_FREQUENCY)).required('Frequency is required'),
	startDate: yup.string().required('Start date is required'),
	endDate: yup.string().nullable(),
	autoApprove: yup.boolean().default(false)
})
