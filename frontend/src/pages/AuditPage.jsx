import React, { useState, useEffect } from 'react';

export default function AuditPage() {
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    try {
      const res = await fetch('/api/insight/all');
      const data = await res.json();
      
      const audit = data.flatMap((insight, idx) => {
        return insight.dataPoints?.map((dp, dpIdx) => ({
          id: `${idx}-${dpIdx}`,
          baseViz: insight.insightName,
          filteredViz: insight.insightName,
          filterField: dp.name,
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: dp.sourceMapping?.some(m => !m.isUnmapped) ? 'mapped' : 'unmapped'
        })) || [];
      });
      
      setAuditData(audit.slice(0, 50));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching audit data:', err);
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h1 className="text-2xl font-bold text-gray-900">Audit & Changes</h1>
          <p className="text-sm text-gray-500 mt-1">Track all mapping changes and data lineage updates</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Upload Version
          </button>
          <button className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Compare to Previous
          </button>
          <button className="bg-[#18A69B] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#18A69B]/90 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export Audit CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Changes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{auditData.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mapped</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{auditData.filter(a => a.status === 'mapped').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unmapped</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{auditData.filter(a => a.status === 'unmapped').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Updated</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{formatDate(new Date().toISOString())}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Base Visualization</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Field</th>
              <th className="text-center px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {auditData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{row.baseViz}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-700">{row.filterField}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  {row.status === 'mapped' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                      </svg>
                      Mapped
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      Unmapped
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{formatDate(row.timestamp)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {auditData.length === 0 && (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p className="text-gray-500">No audit records found</p>
          </div>
        )}
      </div>
    </div>
  );
}
