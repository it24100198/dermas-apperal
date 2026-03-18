import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import vendorService from '../../services/vendorService'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import Loader from '../../components/common/Loader'
import Button from '../../components/common/Button'
import { getErrorMessage } from '../../utils/helpers'

const initialForm = {
  name: '',
  type: 'vendor',
  contactPerson: '',
  email: '',
  phone: '',
  paymentTerms: 'immediate',
  notes: ''
}

const Vendors = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [vendors, setVendors] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(initialForm)

  const loadVendors = async () => {
    try {
      setLoading(true)
      const response = await vendorService.getAllVendors({ limit: 500 })
      setVendors(response?.data?.vendors || [])
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load vendors'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVendors()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(initialForm)
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row._id)
    setForm({
      name: row.name || '',
      type: row.type || 'vendor',
      contactPerson: row.contactPerson || '',
      email: row.email || '',
      phone: row.phone || '',
      paymentTerms: row.paymentTerms || 'immediate',
      notes: row.notes || ''
    })
    setModalOpen(true)
  }

  const saveVendor = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Vendor name and phone are required')
      return
    }

    try {
      setSaving(true)
      if (editingId) {
        await vendorService.updateVendor(editingId, form)
        toast.success('Vendor updated')
      } else {
        await vendorService.createVendor(form)
        toast.success('Vendor created')
      }
      setModalOpen(false)
      loadVendors()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save vendor'))
    } finally {
      setSaving(false)
    }
  }

  const deleteVendor = async (id) => {
    if (!window.confirm('Delete this vendor?')) return

    try {
      setSaving(true)
      await vendorService.deleteVendor(id)
      toast.success('Vendor removed')
      loadVendors()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete vendor'))
    } finally {
      setSaving(false)
    }
  }

  const columns = useMemo(() => [
    {
      header: 'Vendor',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.name}</p>
          <p className="text-xs text-slate-500">{row.contactPerson || '-'}</p>
        </div>
      )
    },
    { header: 'Type', key: 'type' },
    { header: 'Email', key: 'email' },
    { header: 'Phone', key: 'phone' },
    { header: 'Terms', key: 'paymentTerms' },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="text-brand-cyan" onClick={() => openEdit(row)}>
            <PencilSquareIcon className="h-5 w-5" />
          </button>
          <button type="button" className="text-rose-600" onClick={() => deleteVendor(row._id)}>
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      )
    }
  ], [])

  if (loading) {
    return <Loader />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display text-brand-navy">Vendors</h1>
        <Button variant="dashboard" onClick={openCreate}>
          <PlusIcon className="h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      <Card title={`Vendors (${vendors.length})`}>
        <Table columns={columns} data={vendors} searchable />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Vendor' : 'Create Vendor'}
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveVendor} loading={saving}>{editingId ? 'Save' : 'Create'}</Button>
          </div>
        )}
      >
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Vendor Name</label>
              <input className="input-field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input-field" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                <option value="vendor">vendor</option>
                <option value="landlord">landlord</option>
                <option value="supplier">supplier</option>
                <option value="service_provider">service provider</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Person</label>
              <input className="input-field" value={form.contactPerson} onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input-field" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input className="input-field" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </div>
            <div>
              <label className="label">Payment Terms</label>
              <select className="input-field" value={form.paymentTerms} onChange={(event) => setForm({ ...form, paymentTerms: event.target.value })}>
                <option value="immediate">immediate</option>
                <option value="7_days">7 days</option>
                <option value="15_days">15 days</option>
                <option value="30_days">30 days</option>
                <option value="45_days">45 days</option>
                <option value="60_days">60 days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea rows={3} className="input-field" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Vendors
