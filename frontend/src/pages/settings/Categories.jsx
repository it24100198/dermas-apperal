import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import categoryService from '../../services/categoryService'
import Card from '../../components/common/Card'
import Table from '../../components/common/Table'
import Loader from '../../components/common/Loader'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import { getErrorMessage } from '../../utils/helpers'

const emptyForm = {
  name: '',
  type: 'master',
  parentCategory: '',
  description: ''
}

const Categories = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState([])
  const [masters, setMasters] = useState([])
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await categoryService.getAllCategories({ limit: 500, sort: 'name' })
      const items = response?.data?.categories || []
      setCategories(items)
      setMasters(items.filter((item) => item.type === 'master'))
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load categories'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row._id)
    setForm({
      name: row.name,
      type: row.type,
      parentCategory: row.parentCategory?._id || '',
      description: row.description || ''
    })
    setOpen(true)
  }

  const saveCategory = async () => {
    if (!form.name.trim()) {
      toast.error('Category name is required')
      return
    }

    if (form.type === 'sub' && !form.parentCategory) {
      toast.error('Sub category requires parent category')
      return
    }

    try {
      setSaving(true)
      const payload = {
        name: form.name.trim(),
        type: form.type,
        parentCategory: form.type === 'sub' ? form.parentCategory : undefined,
        description: form.description
      }

      if (editingId) {
        await categoryService.updateCategory(editingId, payload)
        toast.success('Category updated')
      } else {
        await categoryService.createCategory(payload)
        toast.success('Category created')
      }

      setOpen(false)
      loadCategories()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save category'))
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return

    try {
      setSaving(true)
      await categoryService.deleteCategory(id)
      toast.success('Category removed')
      loadCategories()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete category'))
    } finally {
      setSaving(false)
    }
  }

  const seedDefaults = async () => {
    try {
      setSaving(true)
      await categoryService.seedDefaultCategories()
      toast.success('Default categories seeded')
      loadCategories()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to seed categories'))
    } finally {
      setSaving(false)
    }
  }

  const columns = useMemo(() => [
    { header: 'Name', key: 'name' },
    { header: 'Type', key: 'type' },
    {
      header: 'Parent',
      key: 'parentCategory',
      render: (row) => row.parentCategory?.name || '-'
    },
    {
      header: 'Status',
      key: 'isActive',
      render: (row) => row.isActive ? 'Active' : 'Inactive'
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="text-brand-cyan" onClick={() => openEdit(row)}>
            <PencilSquareIcon className="h-5 w-5" />
          </button>
          <button type="button" className="text-rose-600" onClick={() => deleteCategory(row._id)}>
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
        <h1 className="text-3xl font-display text-brand-navy">Expense Categories</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={seedDefaults} loading={saving}>Seed Defaults</Button>
          <Button variant="dashboard" onClick={openCreate}>
            <PlusIcon className="h-4 w-4" />
            New Category
          </Button>
        </div>
      </div>

      <Card title={`Categories (${categories.length})`}>
        <Table columns={columns} data={categories} searchable />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? 'Edit Category' : 'Create Category'}
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={saveCategory} loading={saving}>{editingId ? 'Save' : 'Create'}</Button>
          </div>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Category Name</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>

          <div>
            <label className="label">Type</label>
            <select
              className="input-field"
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value, parentCategory: '' })}
            >
              <option value="master">Master</option>
              <option value="sub">Sub</option>
            </select>
          </div>

          {form.type === 'sub' ? (
            <div>
              <label className="label">Parent Category</label>
              <select
                className="input-field"
                value={form.parentCategory}
                onChange={(event) => setForm({ ...form, parentCategory: event.target.value })}
              >
                <option value="">Select parent category</option>
                {masters.map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="label">Description</label>
            <textarea
              rows={3}
              className="input-field"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Categories
