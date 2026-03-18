import { useState, useMemo } from 'react'

export const usePagination = (totalItems, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const paginationRange = useMemo(() => {
    const delta = 2
    const range = []
    const rangeWithDots = []
    let l

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i)
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    })

    return rangeWithDots
  }, [currentPage, totalPages])

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginationRange,
  }
}