import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import { ToastContainer } from '../components/dialogs/Toast';
import { useApp } from '../context/AppContext';

export const AppShell: React.FC = () => {
  const { isSidebarCollapsed, toasts, dismissToast } = useApp();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${
          isSidebarCollapsed ? 'pl-16' : 'pl-64'
        }`}
      >
        {/* Fixed TopBar */}
        <TopBar />

        {/* Page Container */}
        <main className="flex-1 mt-14 p-6 overflow-x-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
