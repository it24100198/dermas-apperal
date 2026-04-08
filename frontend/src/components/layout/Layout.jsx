import Sidebar from './Sidebar';

/**
 * Main layout wrapper component.
 * Provides the sidebar + content area shell for all pages.
 */
const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen items-stretch bg-gray-50">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
