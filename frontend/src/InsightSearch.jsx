import React, { useState } from 'react';

export default function InsightSearch() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const searchInsight = async () => {
    try {
      const res = await fetch(`/api/insight/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Insight not found or server error");
      const data = await res.json();
      setResult(data);
      setError(null);
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Insight Search UI</h1>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search for an insight (e.g. Denial Rate)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />
        <button
          onClick={searchInsight}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {error && <p className="text-red-500">❌ {error}</p>}

      {result && (
        <div className="border rounded shadow p-6 space-y-4 bg-white">
          <h2 className="text-xl font-semibold">{result.insightName}</h2>
          <p><strong>Calculation:</strong> {result.calculation}</p>
          <p><strong>Used in Products:</strong> {result.productsUsedIn.join(', ')}</p>

          <div>
            <h3 className="mt-4 text-lg font-semibold">Data Points</h3>
            {result.dataPoints.map((dp, index) => (
              <div key={index} className="mb-6">
                <h4 className="font-medium">📌 {dp.name}</h4>
                <table className="w-full text-sm border border-gray-300 mt-2">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="border px-3 py-2">Client</th>
                      <th className="border px-3 py-2">System</th>
                      <th className="border px-3 py-2">Table</th>
                      <th className="border px-3 py-2">Field</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dp.mappings.map((m, i) => (
                      <tr key={i} className="even:bg-gray-50">
                        <td className="border px-3 py-2">{m.clientName}</td>
                        <td className="border px-3 py-2">{m.sourceSystem}</td>
                        <td className="border px-3 py-2">{m.table}</td>
                        <td className="border px-3 py-2">{m.field}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
