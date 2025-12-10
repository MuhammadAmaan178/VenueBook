import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';

const VenuesHeader = ({ onAddClick, onSearch, onFilter, onExport }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Venues</h1>
        <p className="text-gray-500">Manage your venue listings</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search venues..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
          />
        </div>

        {/* Filter Button */}
        <button
          onClick={onFilter}
          className="p-2 border rounded-lg hover:bg-gray-50 text-gray-600"
          title="Filter"
        >
          <Filter size={20} />
        </button>

        {/* Export Button (using Upload icon as placeholder or generic) - Adding Download icon import if possible, else reusing logic */}
        <button
          onClick={onExport}
          className="p-2 border rounded-lg hover:bg-gray-50 text-gray-600"
          title="Export"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </button>

        <button
          onClick={onAddClick}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Venue
        </button>
      </div>
    </div>
  );
};

export default VenuesHeader;
