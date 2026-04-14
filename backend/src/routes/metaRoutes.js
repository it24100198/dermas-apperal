import { Router } from 'express';
import crypto from 'crypto';
import { Material, Product, Employee, ProductionSection, User } from '../models/index.js';
import { ROLES } from '../config/roles.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'manager', 'supervisor'));

router.get('/materials', async (req, res, next) => {
  try {
    const materials = await Material.find().sort({ name: 1 }).lean();
    res.json(materials);
  } catch (err) {
    next(err);
  }
});

const MATERIAL_TYPES = ['fabric', 'accessory', 'etc'];

function generateTemporaryPassword() {
  const lowers = 'abcdefghijkmnopqrstuvwxyz';
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  const symbols = '!@#$%^&*()-_=+?';
  const all = `${lowers}${uppers}${numbers}${symbols}`;

  const pick = (charset) => charset[crypto.randomInt(0, charset.length)];
  const chars = [
    pick(lowers),
    pick(uppers),
    pick(numbers),
    pick(symbols),
  ];

  for (let i = chars.length; i < 14; i += 1) {
    chars.push(pick(all));
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

router.post('/materials', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const { name, type = 'fabric', stockQty = 0, unit = 'm', unitPrice = 0 } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!MATERIAL_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${MATERIAL_TYPES.join(', ')}` });
    }
    const doc = await Material.create({
      name: name.trim(),
      type,
      stockQty: Math.max(0, Number(stockQty) || 0),
      unit: String(unit).trim() || 'm',
      unitPrice: Math.max(0, Number(unitPrice) || 0),
    });
    res.status(201).json(doc.toObject());
  } catch (err) {
    next(err);
  }
});

router.put('/materials/:id', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const m = await Material.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Material not found' });
    const { name, type, stockQty, unit, unitPrice } = req.body || {};
    if (name != null) m.name = String(name).trim();
    if (type != null) {
      if (!MATERIAL_TYPES.includes(type)) {
        return res.status(400).json({ error: `type must be one of: ${MATERIAL_TYPES.join(', ')}` });
      }
      m.type = type;
    }
    if (stockQty != null) m.stockQty = Math.max(0, Number(stockQty) || 0);
    if (unit != null) m.unit = String(unit).trim() || m.unit;
    if (unitPrice != null) m.unitPrice = Math.max(0, Number(unitPrice) || 0);
    await m.save();
    res.json(m.toObject());
  } catch (err) {
    next(err);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const products = await Product.find({ classification: 'normal' }).sort({ name: 1 }).lean();
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.get('/employees', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const employees = await Employee.find()
      .populate('productionSectionId', 'name slug')
      .populate('userId', 'email name role isActive')
      .sort({ name: 1 })
      .lean();
    res.json(employees);
  } catch (err) {
    next(err);
  }
});

const mapEmployeeRoleToUserRole = (employeeRole) => {
  const normalizedRole = String(employeeRole || '').trim();
  if (normalizedRole === ROLES.ADMIN) return ROLES.ADMIN;
  if (normalizedRole === ROLES.MANAGER) return ROLES.MANAGER;
  if (normalizedRole === ROLES.SUPERVISOR) return ROLES.SUPERVISOR;
  if (
    normalizedRole === 'line_supervisor' ||
    normalizedRole === 'washing_supervisor' ||
    normalizedRole === 'cutting_supervisor'
  ) return ROLES.SUPERVISOR;
  if (normalizedRole === ROLES.ACCOUNTANT) return ROLES.ACCOUNTANT;
  if (normalizedRole === ROLES.OPERATOR) return ROLES.OPERATOR;
  return ROLES.EMPLOYEE;
};

router.post('/employees', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const {
      name,
      email,
      role = 'operator',
      phone = '',
      productionSectionId = null,
      salary = 0,
      isActive = true,
    } = req.body || {};

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const normalizedSalary = Number(salary);
    if (!Number.isFinite(normalizedSalary) || normalizedSalary < 0) {
      return res.status(400).json({ error: 'Salary must be a positive number or zero' });
    }

    const temporaryPassword = generateTemporaryPassword();

    const exists = await User.findOne({ email: email.trim().toLowerCase() }).lean();
    if (exists) return res.status(400).json({ error: 'Email already exists' });

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: temporaryPassword,
      mustChangePassword: true,
      role: mapEmployeeRoleToUserRole(role),
      isActive: Boolean(isActive),
    });

    const employee = await Employee.create({
      userId: user._id,
      productionSectionId: productionSectionId || null,
      role,
      salary: normalizedSalary,
      name: name.trim(),
      phone: phone?.trim() || '',
    });

    const populated = await Employee.findById(employee._id)
      .populate('productionSectionId', 'name slug')
      .populate('userId', 'email name role isActive mustChangePassword')
      .lean();
    res.status(201).json({
      employee: populated,
      temporaryPassword,
      passwordChangeRequired: true,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/employees/:id', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const user = await User.findById(employee.userId).select('+password');
    if (!user) return res.status(404).json({ error: 'Linked user not found' });

    const {
      name,
      email,
      password,
      role,
      phone,
      salary,
      productionSectionId,
      isActive,
    } = req.body || {};

    if (name != null) {
      user.name = String(name).trim();
      employee.name = String(name).trim();
    }
    if (email != null) {
      const normalized = String(email).trim().toLowerCase();
      const conflict = await User.findOne({ email: normalized, _id: { $ne: user._id } }).lean();
      if (conflict) return res.status(400).json({ error: 'Email already exists' });
      user.email = normalized;
    }
    if (password != null && String(password).trim()) {
      user.password = String(password).trim();
    }
    if (role != null) {
      employee.role = role;
      user.role = mapEmployeeRoleToUserRole(role);
    }
    if (phone != null) employee.phone = String(phone).trim();
    if (salary != null) {
      const normalizedSalary = Number(salary);
      if (!Number.isFinite(normalizedSalary) || normalizedSalary < 0) {
        return res.status(400).json({ error: 'Salary must be a positive number or zero' });
      }
      employee.salary = normalizedSalary;
    }
    if (productionSectionId !== undefined) employee.productionSectionId = productionSectionId || null;
    if (isActive !== undefined) user.isActive = Boolean(isActive);

    await user.save();
    await employee.save();

    const populated = await Employee.findById(employee._id)
      .populate('productionSectionId', 'name slug')
      .populate('userId', 'email name role isActive mustChangePassword')
      .lean();
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

router.delete('/employees/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    await User.findByIdAndDelete(employee.userId);
    await Employee.findByIdAndDelete(employee._id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get('/sections', async (req, res, next) => {
  try {
    const type = req.query.type;
    const query = type ? { type, isActive: true } : { isActive: true };
    const sections = await ProductionSection.find(query)
      .populate({ path: 'supervisorEmployeeId', select: 'name role phone userId', populate: { path: 'userId', select: 'email name' } })
      .sort({ name: 1 })
      .lean();
    res.json(sections);
  } catch (err) {
    next(err);
  }
});

/**
 * Assign one supervisor per section. Updates Employee.productionSectionId + role and User.role.
 * Pass supervisorEmployeeId: null to clear supervisor.
 */
router.put('/sections/:id', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const section = await ProductionSection.findById(req.params.id);
    if (!section) return res.status(404).json({ error: 'Section not found' });

    const { supervisorEmployeeId } = req.body || {};
    if (supervisorEmployeeId === undefined) {
      return res.status(400).json({ error: 'supervisorEmployeeId is required (use null to clear)' });
    }

    const prevSupervisorId = section.supervisorEmployeeId;

    // Demote previous supervisor if different
    if (prevSupervisorId && String(prevSupervisorId) !== String(supervisorEmployeeId || '')) {
      const prevEmp = await Employee.findById(prevSupervisorId);
      if (prevEmp && prevEmp.productionSectionId?.equals(section._id)) {
        prevEmp.role = ROLES.OPERATOR;
        await prevEmp.save();
        const prevUser = await User.findById(prevEmp.userId);
        if (prevUser) {
          prevUser.role = ROLES.OPERATOR;
          await prevUser.save();
        }
      }
    }

    if (!supervisorEmployeeId) {
      section.supervisorEmployeeId = null;
      await section.save();
      const updated = await ProductionSection.findById(section._id)
        .populate({ path: 'supervisorEmployeeId', select: 'name role phone userId', populate: { path: 'userId', select: 'email name' } })
        .lean();
      return res.json(updated);
    }

    const newEmp = await Employee.findById(supervisorEmployeeId);
    if (!newEmp) return res.status(404).json({ error: 'Employee not found' });

    if (newEmp.productionSectionId && !newEmp.productionSectionId.equals(section._id)) {
      const oldSec = await ProductionSection.findById(newEmp.productionSectionId);
      if (oldSec?.supervisorEmployeeId?.equals(newEmp._id)) {
        oldSec.supervisorEmployeeId = null;
        await oldSec.save();
      }
    }

    newEmp.productionSectionId = section._id;
    newEmp.role = ROLES.SUPERVISOR;
    await newEmp.save();

    const u = await User.findById(newEmp.userId);
    if (u) {
      u.role = ROLES.SUPERVISOR;
      await u.save();
    }

    section.supervisorEmployeeId = newEmp._id;
    await section.save();

    const updated = await ProductionSection.findById(section._id)
      .populate({ path: 'supervisorEmployeeId', select: 'name role phone userId', populate: { path: 'userId', select: 'email name' } })
      .lean();
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
