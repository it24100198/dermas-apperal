import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import Loader from './Loader'

const Table = ({
  columns,
  data,
  pageSize = 10,
  searchable = false,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
}) => {
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)

  const filteredData = useMemo(() => {
    if (!searchable || !searchText.trim()) return data
    const term = searchText.toLowerCase()
    return data.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(term)
    )
  }, [data, searchable, searchText])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page, pageSize])

  const resolveValue = (row, key) => {
    if (!key.includes('.')) return row[key]

    return key.split('.').reduce((acc, path) => {
      if (acc === undefined || acc === null) return undefined
      return acc[path]
    }, row)
  }

  const goPrevious = () => setPage((current) => Math.max(1, current - 1))
  const goNext = () => setPage((current) => Math.min(totalPages, current + 1))

  return (
    <div className="flex flex-col">
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value)
              setPage(1)
            }}
            placeholder="Search..."
            className="input-field max-w-xs"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="min-w-[760px]">
          <table className="w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((column) => (
                  <th key={column.key || column.header} className="table-header">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td className="table-cell" colSpan={columns.length}>
                    <Loader inline text="Loading table data..." />
                  </td>
                </tr>
              ) : pagedData.length === 0 ? (
                <tr>
                  <td className="table-cell text-center text-slate-500" colSpan={columns.length}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                pagedData.map((row, rowIndex) => (
                  <tr
                    key={row._id || row.id || rowIndex}
                    onClick={() => onRowClick?.(row)}
                    className={onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}
                  >
                    {columns.map((column) => (
                      <td key={column.key || column.header} className="table-cell">
                        {column.render
                          ? column.render(row, rowIndex)
                          : resolveValue(row, column.key)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
        <span>
          Showing {(page - 1) * pageSize + (pagedData.length ? 1 : 0)}-
          {(page - 1) * pageSize + pagedData.length} of {filteredData.length}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={goPrevious}
            disabled={page <= 1}
            className="btn-secondary px-3 py-1"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <span className="px-2">{page} / {totalPages}</span>
          <button
            onClick={goNext}
            disabled={page >= totalPages}
            className="btn-secondary px-3 py-1"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      header: PropTypes.string.isRequired,
      key: PropTypes.string,
      render: PropTypes.func
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  pageSize: PropTypes.number,
  searchable: PropTypes.bool,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  onRowClick: PropTypes.func,
}

export default Table