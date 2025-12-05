import React, { useState, useEffect } from 'react';

export default function InsightSearch() {
  const [query, setQuery] = useState('');
  const [insightOptions, setInsightOptions] = useState([]);
  const [allData, setAllData] = useState([]);
  const [filteredInsight, setFilteredInsight] = useState(null);
  const [error, setError] = useState(null);

  // Load dropdown + all insight data
  useEffect(() => {
    fetch('/api/insights')
      .then(res => res.json())
      .then(data => setInsightOptions(data.map(i => i.insightName)));

    fetch('/api/insight/all')
      .then(res => res.json())
      .then(setAllData)
      .catch(err => console.error("Failed to fetch all data:", err));
  }, []);

  // Handle dropdown filter
  const filterByInsight = async () => {
    if (!query) {
      setFilteredInsight(null);
      return;
    }

    try {
      const res = await fetch(`/api/insight/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Insight not found");
      const data = await res.json();
      setFilteredInsight(data);
      setError(null);
    } catch (err) {
      setFilteredInsight(null);
      setError(err.message);
    }
  };

  // Table for ALL insights view (homepage)
  const renderFullTable = (rows) => (
    <div className="overflow-x-auto bg-white border rounded shadow p-4">
      <table className="w-full text-sm border border-gray-300">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="border px-3 py-2">Insight</th>
            <th className="border px-3 py-2">Calculation</th>
            <th className="border px-3 py-2">Used In Products</th>
            <th className="border px-3 py-2">Data Point</th>
            <th className="border px-3 py-2">Source</th>
            <th className="border px-3 py-2">System</th>
            <th className="border px-3 py-2">Table</th>
            <th className="border px-3 py-2">Field</th>
            <th className="border px-3 py-2">Data Type</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="even:bg-gray-50">
              <td className="border px-3 py-2">{row.insightName}</td>
              <td className="border px-3 py-2">{row.calculation}</td>
              <td className="border px-3 py-2">{row.productsUsedIn?.join(', ')}</td>
              <td className="border px-3 py-2">{row.dataPoint}</td>
              <td className="border px-3 py-2">{row.sourceName}</td>
              <td className="border px-3 py-2">{row.sourceSystem}</td>
              <td className="border px-3 py-2">{row.table}</td>
              <td className="border px-3 py-2">{row.field}</td>
              <td className="border px-3 py-2">{row.dataType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Table for filtered insight view
  const renderFilteredTable = (rows) => (
    <div className="overflow-x-auto bg-white border rounded shadow p-4">
      <table className="w-full text-sm border border-gray-300">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="border px-3 py-2">Data Point</th>
            <th className="border px-3 py-2">Source</th>
            <th className="border px-3 py-2">System</th>
            <th className="border px-3 py-2">Table</th>
            <th className="border px-3 py-2">Field</th>
            <th className="border px-3 py-2">Data Type</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="even:bg-gray-50">
              <td className="border px-3 py-2">{row.dataPoint}</td>
              <td className="border px-3 py-2">{row.sourceName}</td>
              <td className="border px-3 py-2">{row.sourceSystem}</td>
              <td className="border px-3 py-2">{row.table}</td>
              <td className="border px-3 py-2">{row.field}</td>
              <td className="border px-3 py-2">{row.dataType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Insight Search UI</h1>

      {/* Dropdown filter */}
      <div className="flex gap-4 items-center">
        <select
          className="border border-gray-300 rounded px-3 py-2 w-full"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        >
          <option value="">-- Select an Insight to Filter --</option>
          {insightOptions.map((insight, idx) => (
            <option key={idx} value={insight}>{insight}</option>
          ))}
        </select>

        <button
          onClick={filterByInsight}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Filter
        </button>
      </div>

      {error && <p className="text-red-500">❌ {error}</p>}

      {/* Filtered Insight Summary + Table */}
      {filteredInsight && (
        <>
          <div className="bg-white border rounded shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold">{filteredInsight.insightName}</h2>
            <p><strong>Calculation:</strong> {filteredInsight.calculation}</p>
            <p><strong>Used in Products:</strong> {filteredInsight.productsUsedIn.join(', ')}</p>
          </div>

          {renderFilteredTable(
            filteredInsight.dataPoints.flatMap(dp =>
              (Array.isArray(dp.sourceMapping) ? dp.sourceMapping : []).map(m => ({
                dataPoint: dp.name,
                sourceName: m.sourceName,
                sourceSystem: m.sourceSystem,
                table: m.table,
                field: m.field,
                dataType: m.dataType
              }))
            )
          )}
        </>
      )}

      {/* Show full insight list only if NOT filtered */}
      {!query && renderFullTable(allData)}
    </div>
  );
}
