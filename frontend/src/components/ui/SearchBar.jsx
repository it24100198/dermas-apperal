import { Search } from 'lucide-react';

/**
 * SearchBar — Search input with optional filter dropdown.
 */
const SearchBar = ({
  searchTerm,
  onSearchChange,
  placeholder = 'Search...',
  filterValue,
  onFilterChange,
  filterOptions = [],
  filterLabel = 'Filter',
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search input */}
      <div className="relative flex-1">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          id="search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white
                     text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                     transition-all duration-200 placeholder:text-gray-400"
        />
      </div>

      {/* Filter dropdown */}
      {filterOptions.length > 0 && (
        <select
          id="filter-select"
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                     transition-all duration-200 text-gray-600 min-w-[160px] cursor-pointer"
        >
          <option value="">{`All ${filterLabel}`}</option>
          {filterOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default SearchBar;
