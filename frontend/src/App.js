import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MappingsExplorer from './pages/MappingsExplorer';
import VisualizationDetail from './pages/VisualizationDetail';
import AuditPage from './pages/AuditPage';
import ImportPage from './pages/ImportPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="explorer" element={<MappingsExplorer />} />
          <Route path="visualization/:id" element={<VisualizationDetail />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="import" element={<ImportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
