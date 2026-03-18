import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/common/Sidebar'
import Navbar from '../components/common/Navbar'

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-64">
        <Navbar setSidebarOpen={setSidebarOpen} />

        <main className="px-4 py-6 md:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout