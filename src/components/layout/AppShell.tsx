import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { AppNavbar } from './AppNavbar';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar onCollapse={setCollapsed} />
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-200"
        style={{ marginLeft: collapsed ? '3.5rem' : '15rem' }}
      >
        <AppNavbar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
