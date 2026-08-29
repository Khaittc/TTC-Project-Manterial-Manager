import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppShell } from './app/AppShell';

// Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { MonitoringPage } from './pages/monitoring/MonitoringPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { MaterialListPage } from './pages/materials/MaterialListPage';
import { MaterialFormPage } from './pages/materials/MaterialFormPage';
import { MaterialDetailPage } from './pages/materials/MaterialDetailPage';
import { SupplierDetailPage } from './pages/suppliers/SupplierDetailPage';
import { StockInPage } from './pages/inventory/StockInPage';
import { StockOutPage } from './pages/inventory/StockOutPage';
import { HistoryPage } from './pages/inventory/HistoryPage';
import { SystemMastersPage } from './pages/masters/SystemMastersPage';
import { AdministrationPage } from './pages/admin/AdministrationPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="project-material-monitoring" element={<MonitoringPage />} />
            <Route path="projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="materials" element={<MaterialListPage />} />
            <Route path="materials/new" element={<MaterialFormPage />} />
            <Route path="materials/:materialId/edit" element={<MaterialFormPage />} />
            <Route path="materials/:materialId" element={<MaterialDetailPage />} />
            <Route path="suppliers/:supplierId" element={<SupplierDetailPage />} />
            <Route path="inventory/stock-in" element={<StockInPage />} />
            <Route path="inventory/stock-out" element={<StockOutPage />} />
            <Route path="inventory/history" element={<HistoryPage />} />
            <Route path="system-masters" element={<SystemMastersPage />} />
            <Route path="administration" element={<AdministrationPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
