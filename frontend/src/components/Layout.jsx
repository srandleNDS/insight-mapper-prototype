import React, { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import AiChat from './AiChat';

const FilterContext = createContext();

export function useFilters() {
  return useContext(FilterContext);
}

export default function Layout() {
  const [globalSearch, setGlobalSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState({
    tabName: [],
    product: [],
    incompleteOnly: false
  });
  const [tabOptions, setTabOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetch('/api/tabs').then(r => r.json()),
      fetch('/api/products').then(r => r.json())
    ]).then(([tabs, products]) => {
      setTabOptions(tabs.sort());
      setProductOptions(products.sort());
    }).catch(err => console.error('Error loading filter options:', err));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/explorer?search=${encodeURIComponent(globalSearch)}`);
    }
  };

  const toggleFilter = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value) 
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }));
  };

  const toggleIncomplete = () => {
    setFilters(prev => ({
      ...prev,
      incompleteOnly: !prev.incompleteOnly
    }));
  };

  const clearFilters = () => {
    setFilters({
      tabName: [],
      product: [],
      incompleteOnly: false
    });
  };

  const activeFilterCount = filters.tabName.length + filters.product.length + (filters.incompleteOnly ? 1 : 0);

  return (
    <FilterContext.Provider value={{ filters, toggleFilter, toggleIncomplete, clearFilters }}>
      <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
        <header className="bg-white border-b border-gray-200 py-3 px-6 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <NavLink to="/" className="flex items-center gap-2">
                <div className="bg-[#18A69B] w-8 h-8 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <span className="text-lg font-black text-gray-900 tracking-tight">
                  Insight<span className="text-[#18A69B]">Mapper</span>
                </span>
              </NavLink>

              <nav className="hidden md:flex items-center gap-1">
                <NavLink 
                  to="/" 
                  end
                  className={({isActive}) => `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${isActive ? 'bg-[#18A69B]/10 text-[#18A69B]' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Dashboard
                </NavLink>
                <NavLink 
                  to="/explorer" 
                  className={({isActive}) => `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${isActive ? 'bg-[#18A69B]/10 text-[#18A69B]' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Explorer
                </NavLink>
                <NavLink 
                  to="/audit" 
                  className={({isActive}) => `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${isActive ? 'bg-[#18A69B]/10 text-[#18A69B]' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Audit
                </NavLink>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <form onSubmit={handleSearch} className="relative hidden md:block">
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search viz, field, or table..."
                  className="w-72 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pl-10 text-sm focus:ring-2 focus:ring-[#18A69B] focus:border-transparent outline-none"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </form>
              
              <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex-shrink-0`}>
            <Sidebar 
              sidebarOpen={sidebarOpen} 
              setSidebarOpen={setSidebarOpen}
              filters={filters}
              toggleFilter={toggleFilter}
              toggleIncomplete={toggleIncomplete}
              clearFilters={clearFilters}
              activeFilterCount={activeFilterCount}
              tabOptions={tabOptions}
              productOptions={productOptions}
            />
          </aside>

          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
        <AiChat />
      </div>
    </FilterContext.Provider>
  );
}

function Sidebar({ sidebarOpen, setSidebarOpen, filters, toggleFilter, toggleIncomplete, clearFilters, activeFilterCount, tabOptions, productOptions }) {
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#18A69B] text-white text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {activeFilterCount > 0 && (
            <button 
              onClick={clearFilters}
              className="text-xs text-[#18A69B] hover:underline font-medium mr-2"
            >
              Clear all
            </button>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold text-gray-500 mb-2">Tab Name</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {tabOptions.map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={filters.tabName.includes(opt)}
                  onChange={() => toggleFilter('tabName', opt)}
                  className="w-4 h-4 rounded border-gray-300 text-[#18A69B] focus:ring-[#18A69B]"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 truncate">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-gray-500 mb-2">Product</h4>
          <div className="space-y-1">
            {productOptions.map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={filters.product.includes(opt)}
                  onChange={() => toggleFilter('product', opt)}
                  className="w-4 h-4 rounded border-gray-300 text-[#18A69B] focus:ring-[#18A69B]"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={filters.incompleteOnly}
              onChange={toggleIncomplete}
              className="w-4 h-4 rounded border-gray-300 text-[#18A69B] focus:ring-[#18A69B]"
            />
            <span className="text-sm text-gray-600">Show incomplete lineage only</span>
          </label>
        </div>
      </div>
    </div>
  );
}
