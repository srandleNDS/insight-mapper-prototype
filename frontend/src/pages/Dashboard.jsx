import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVisualizations: 0,
    totalFields: 0,
    mappedFields: 0,
    unmappedFields: 0
  });
  const [recentViz, setRecentViz] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/insight/list?per_page=5')
      ]);
      
      const statsData = await statsRes.json();
      const listData = await listRes.json();

      setStats({
        totalVisualizations: statsData.totalVisualizations,
        totalFields: statsData.totalFields,
        mappedFields: statsData.mappedFields,
        unmappedFields: statsData.unmappedFields,
        sourceSystems: statsData.sourceSystems
      });
      setRecentViz(listData.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
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
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your data visualization mappings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Visualizations" 
          value={stats.totalVisualizations} 
          icon="chart"
          color="teal"
        />
        <StatCard 
          title="Total Fields" 
          value={stats.totalFields} 
          icon="fields"
          color="blue"
        />
        <StatCard 
          title="Mapped Fields" 
          value={stats.mappedFields} 
          icon="check"
          color="green"
        />
        <StatCard 
          title="Unmapped Fields" 
          value={stats.unmappedFields} 
          icon="warning"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Visualizations</h2>
            <Link to="/explorer" className="text-sm text-[#18A69B] font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentViz.map((viz, idx) => (
              <Link 
                key={viz.id || idx}
                to={`/visualization/${viz.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${viz.unmappedFields > 0 ? 'bg-orange-400' : 'bg-[#18A69B]'}`}></div>
                  <span className="font-medium text-gray-800 group-hover:text-[#18A69B]">{viz.insightName}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">{viz.tabName || 'General'}</span>
                </div>
                <span className="text-xs text-gray-400">{viz.totalFields || 0} fields</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link 
              to="/explorer" 
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-[#18A69B] hover:bg-[#18A69B]/5 transition-all group"
            >
              <svg className="w-6 h-6 text-gray-400 group-hover:text-[#18A69B] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#18A69B]">Explore Mappings</span>
            </Link>
            <Link 
              to="/audit" 
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-[#18A69B] hover:bg-[#18A69B]/5 transition-all group"
            >
              <svg className="w-6 h-6 text-gray-400 group-hover:text-[#18A69B] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#18A69B]">View Audit Log</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Mapping Coverage</h2>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#18A69B] transition-all duration-500"
            style={{ width: `${stats.totalFields > 0 ? (stats.mappedFields / stats.totalFields * 100) : 0}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-gray-500">{stats.mappedFields} mapped</span>
          <span className="text-orange-500">{stats.unmappedFields} unmapped</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    teal: 'bg-[#18A69B]/10 text-[#18A69B]',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  const icons = {
    chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>,
    fields: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>,
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>,
    warning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icons[icon]}
          </svg>
        </div>
      </div>
    </div>
  );
}
