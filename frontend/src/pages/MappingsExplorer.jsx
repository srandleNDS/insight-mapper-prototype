import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useFilters } from '../components/Layout';

export default function MappingsExplorer() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grouped');
  const [expandedRows, setExpandedRows] = useState({});
  const [expandedData, setExpandedData] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { filters } = useFilters() || { filters: { tabName: [], product: [], incompleteOnly: false } };

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const searchQuery = searchParams.get('search') || '';
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '50',
        incomplete_only: filters.incompleteOnly.toString()
      });
      if (searchQuery) params.set('search', searchQuery);
      if (filters.product && filters.product.length > 0) {
        params.set('product', filters.product.join(','));
      }
      if (filters.tabName && filters.tabName.length > 0) {
        params.set('tab', filters.tabName.join(','));
      }
      
      const res = await fetch(`/api/insight/list?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setTotalPages(json.totalPages || 1);
      setTotal(json.total || 0);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  }, [page, filters.incompleteOnly, filters.product, filters.tabName, searchParams]);

  useEffect(() => {
    setPage(1);
  }, [filters.incompleteOnly, filters.product, filters.tabName, searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchExpandedData = async (insightId) => {
    if (expandedData[insightId]) return;
    try {
      const res = await fetch(`/api/insight/${insightId}`);
      const json = await res.json();
      setExpandedData(prev => ({ ...prev, [insightId]: json }));
    } catch (err) {
      console.error('Error fetching expanded data:', err);
    }
  };

  const toggleExpand = (id) => {
    const newState = !expandedRows[id];
    setExpandedRows(prev => ({
      ...prev,
      [id]: newState
    }));
    if (newState) {
      fetchExpandedData(id);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#18A69B]"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mappings Explorer</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} visualization{total !== 1 ? 's' : ''} found
            {(filters.tabName.length > 0 || filters.product.length > 0 || filters.incompleteOnly) && (
              <span className="text-[#18A69B] ml-1">(filtered)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#18A69B] focus:border-transparent outline-none"
          >
            <option value="grouped">View: Grouped by Base</option>
            <option value="flat">View: Flat List</option>
          </select>
          <button className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Export CSV
          </button>
          <button className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Share Link
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Tab Name</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Data Visualization</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Filter Context</th>
              <th className="text-center px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider"># Fields</th>
              <th className="text-center px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((insight) => {
              const fieldCount = insight.totalFields || 0;
              const unmappedCount = insight.unmappedFields || 0;
              const isExpanded = expandedRows[insight.id];
              const tabName = insight.tabName || 'General';
              const insightDetail = expandedData[insight.id];

              return (
                <React.Fragment key={insight.id}>
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => toggleExpand(insight.id)}
                  >
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        insight.product === 'InsightFlow' ? 'bg-[#18A69B]/10 text-[#18A69B]' :
                        insight.product === 'DenialIQ' ? 'bg-blue-50 text-blue-600' :
                        insight.product === 'PayerIQ' ? 'bg-purple-50 text-purple-600' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {insight.product || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {tabName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                        </svg>
                        <span className="font-medium text-gray-900">{insight.insightName}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#18A69B]/10 text-[#18A69B]">
                          BASE
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">—</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">{fieldCount}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {unmappedCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                          </svg>
                          {unmappedCount} unmapped
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                          </svg>
                          Complete
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/visualization/${insight.id}`}
                        className="text-[#18A69B] hover:underline text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-gray-50/50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="ml-8 space-y-2">
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Data Points</div>
                          {!insightDetail ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#18A69B]"></div>
                            </div>
                          ) : (
                          <div className="grid gap-2">
                            {insightDetail.dataPoints?.map((dp, dpIdx) => {
                              const mapping = dp.sourceMapping?.[0];
                              const isUnmapped = mapping?.isUnmapped;
                              return (
                                <div 
                                  key={dpIdx} 
                                  className={`flex items-center justify-between p-3 rounded-lg border ${isUnmapped ? 'bg-orange-50/50 border-orange-200' : 'bg-white border-gray-100'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${isUnmapped ? 'bg-orange-400' : 'bg-green-500'}`}></span>
                                    <span className="font-medium text-gray-800 text-sm">{dp.name}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    {mapping && !isUnmapped && (
                                      <>
                                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">{mapping.table || '—'}</span>
                                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">{mapping.field || '—'}</span>
                                        <span className="text-gray-400">{mapping.dataType || '—'}</span>
                                      </>
                                    )}
                                    {isUnmapped && (
                                      <span className="text-orange-600 font-medium">Unmapped</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-gray-500">No visualizations found</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
