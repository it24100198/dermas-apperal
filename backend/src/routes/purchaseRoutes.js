import { Router } from 'express';
import Supplier from '../models/Supplier.js';
import MaterialCatalog from '../models/MaterialCatalog.js';
import PurchaseRequisition from '../models/PurchaseRequisition.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import GoodsReceivedNote from '../models/GoodsReceivedNote.js';

const router = Router();

// ═══════════════════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════════════════

router.get('/suppliers', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.active) filter.isActive = req.query.active === 'true';
    const suppliers = await Supplier.find(filter).sort({ name: 1 });
    res.json(suppliers);
  } catch (err) { next(err); }
});

router.post('/suppliers', async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (err) { next(err); }
});

router.put('/suppliers/:id', async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (err) { next(err); }
});

router.delete('/suppliers/:id', async (req, res, next) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════
// MATERIAL CATALOG
// ═══════════════════════════════════════════════

router.get('/materials', async (req, res, next) => {
  try {
    const materials = await MaterialCatalog.find()
      .populate('preferredSupplier', 'name')
      .sort({ name: 1 });
    res.json(materials);
  } catch (err) { next(err); }
});

router.get('/materials/reorder-alerts', async (req, res, next) => {
  try {
    const items = await MaterialCatalog.find({
      $expr: { $lte: ['$currentStock', '$reorderLevel'] },
      reorderLevel: { $gt: 0 },
    }).populate('preferredSupplier', 'name');
    res.json(items);
  } catch (err) { next(err); }
});

router.post('/materials', async (req, res, next) => {
  try {
    const material = await MaterialCatalog.create(req.body);
    res.status(201).json(material);
  } catch (err) { next(err); }
});

router.put('/materials/:id', async (req, res, next) => {
  try {
    const material = await MaterialCatalog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!material) return res.status(404).json({ error: 'Material not found' });
    res.json(material);
  } catch (err) { next(err); }
});

router.delete('/materials/:id', async (req, res, next) => {
  try {
    await MaterialCatalog.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════
// REQUISITIONS
// ═══════════════════════════════════════════════

router.get('/requisitions', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const reqs = await PurchaseRequisition.find(filter)
      .populate('items.material', 'name uom')
      .populate('linkedPO', 'poNumber status')
      .sort({ createdAt: -1 });
    res.json(reqs);
  } catch (err) { next(err); }
});

router.post('/requisitions', async (req, res, next) => {
  try {
    const req_ = await PurchaseRequisition.create(req.body);
    res.status(201).json(req_);
  } catch (err) { next(err); }
});

router.put('/requisitions/:id/approve', async (req, res, next) => {
  try {
    const { approvedBy, approvalNote, supplierId, expectedDeliveryDate } = req.body;
    const requisition = await PurchaseRequisition.findById(req.params.id)
      .populate('items.material', 'name uom unitPrice');
    if (!requisition) return res.status(404).json({ error: 'Requisition not found' });

    // Auto-create Purchase Order
    const poItems = requisition.items.map(item => ({
      material: item.material._id,
      description: item.material.name,
      qty: item.qty,
      unitPrice: item.material.unitPrice || 0,
      totalPrice: item.qty * (item.material.unitPrice || 0),
    }));

    const po = await PurchaseOrder.create({
      supplier: supplierId,
      requisition: requisition._id,
      items: poItems,
      expectedDeliveryDate: expectedDeliveryDate || null,
      notes: `Auto-generated from Requisition`,
    });

    requisition.status = 'approved';
    requisition.approvedBy = approvedBy || 'Manager';
    requisition.approvalNote = approvalNote || '';
    requisition.approvedAt = new Date();
    requisition.linkedPO = po._id;
    await requisition.save();

    res.json({ requisition, po });
  } catch (err) { next(err); }
});

router.put('/requisitions/:id/reject', async (req, res, next) => {
  try {
    const requisition = await PurchaseRequisition.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', approvedBy: req.body.approvedBy, approvalNote: req.body.approvalNote, approvedAt: new Date() },
      { new: true }
    );
    if (!requisition) return res.status(404).json({ error: 'Requisition not found' });
    res.json(requisition);
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════
// PURCHASE ORDERS
// ═══════════════════════════════════════════════

router.get('/orders', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const orders = await PurchaseOrder.find(filter)
      .populate('supplier', 'name email phone')
      .populate('items.material', 'name uom')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { next(err); }
});

router.post('/orders', async (req, res, next) => {
  try {
    const order = await PurchaseOrder.create(req.body);
    const populated = await order.populate('supplier', 'name email');
    res.status(201).json(populated);
  } catch (err) { next(err); }
});

router.put('/orders/:id', async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'PO not found' });
    Object.assign(order, req.body);
    if (req.body.status === 'sent') order.sentAt = new Date();
    await order.save();
    res.json(order);
  } catch (err) { next(err); }
});

router.delete('/orders/:id', async (req, res, next) => {
  try {
    await PurchaseOrder.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════
// GOODS RECEIVED NOTES
// ═══════════════════════════════════════════════

router.get('/grn', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    const grns = await GoodsReceivedNote.find(filter)
      .populate({ path: 'purchaseOrder', populate: { path: 'supplier', select: 'name' } })
      .populate('items.material', 'name uom')
      .sort({ createdAt: -1 });
    res.json(grns);
  } catch (err) { next(err); }
});

router.post('/grn', async (req, res, next) => {
  try {
    const grn = await GoodsReceivedNote.create(req.body);

    // Auto-update material stock for passed QC items
    for (const item of grn.items) {
      if (item.material && item.qcStatus === 'pass') {
        await MaterialCatalog.findByIdAndUpdate(item.material, {
          $inc: { currentStock: item.receivedQty },
        });
      }
    }

    // Mark PO as received
    await PurchaseOrder.findByIdAndUpdate(grn.purchaseOrder, { status: 'received' });

    const populated = await grn.populate([
      { path: 'purchaseOrder', populate: { path: 'supplier', select: 'name' } },
      { path: 'items.material', select: 'name uom' },
    ]);
    res.status(201).json(populated);
  } catch (err) { next(err); }
});

router.put('/grn/:id/payment', async (req, res, next) => {
  try {
    const { amountPaid, paymentMethod, paymentNote, invoiceNumber, invoiceAmount } = req.body;
    const grn = await GoodsReceivedNote.findById(req.params.id);
    if (!grn) return res.status(404).json({ error: 'GRN not found' });

    if (invoiceNumber) grn.invoiceNumber = invoiceNumber;
    if (invoiceAmount) grn.invoiceAmount = invoiceAmount;
    grn.amountPaid = (grn.amountPaid || 0) + Number(amountPaid);
    grn.paymentMethod = paymentMethod || grn.paymentMethod;
    grn.paymentNote = paymentNote || '';
    grn.paidAt = new Date();

    const outstanding = (grn.invoiceAmount || 0) - grn.amountPaid;
    grn.paymentStatus = outstanding <= 0 ? 'paid' : grn.amountPaid > 0 ? 'partial' : 'unpaid';

    await grn.save();
    res.json(grn);
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════

router.get('/analytics/summary', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const start = new Date(`${year}-01-01`);
    const end   = new Date(`${year + 1}-01-01`);

    // Monthly spend from GRNs
    const monthlySpend = await GoodsReceivedNote.aggregate([
      { $match: { receivedDate: { $gte: start, $lt: end } } },
      { $group: { _id: { $month: '$receivedDate' }, total: { $sum: '$invoiceAmount' }, paid: { $sum: '$amountPaid' } } },
      { $sort: { _id: 1 } },
    ]);

    // Spend by supplier
    const bySupplier = await GoodsReceivedNote.aggregate([
      { $match: { receivedDate: { $gte: start, $lt: end } } },
      { $lookup: { from: 'purchaseorders', localField: 'purchaseOrder', foreignField: '_id', as: 'po' } },
      { $unwind: '$po' },
      { $lookup: { from: 'suppliers', localField: 'po.supplier', foreignField: '_id', as: 'sup' } },
      { $unwind: { path: '$sup', preserveNullAndEmpty: true } },
      { $group: { _id: '$sup._id', supplierName: { $first: '$sup.name' }, total: { $sum: '$invoiceAmount' } } },
      { $sort: { total: -1 } },
    ]);

    // Outstanding payments
    const outstanding = await GoodsReceivedNote.find({ paymentStatus: { $in: ['unpaid', 'partial'] } })
      .populate({ path: 'purchaseOrder', populate: { path: 'supplier', select: 'name' } })
      .select('grnNumber invoiceAmount amountPaid paymentStatus purchaseOrder receivedDate')
      .sort({ receivedDate: 1 });

    const totalOutstanding = outstanding.reduce((s, g) => s + ((g.invoiceAmount || 0) - (g.amountPaid || 0)), 0);

    // PO counts
    const [totalPOs, activePOs, receivedPOs] = await Promise.all([
      PurchaseOrder.countDocuments(),
      PurchaseOrder.countDocuments({ status: { $in: ['draft', 'sent', 'shipped'] } }),
      PurchaseOrder.countDocuments({ status: 'received' }),
    ]);

    res.json({ monthlySpend, bySupplier, outstanding, totalOutstanding, totalPOs, activePOs, receivedPOs });
  } catch (err) { next(err); }
});

export default router;
