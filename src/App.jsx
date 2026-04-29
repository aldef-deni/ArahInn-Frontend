import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { useAuthStore } from '@/store/authStore'

// Layouts
import UserLayout   from '@/components/layout/UserLayout'
import AdminLayout  from '@/components/layout/AdminLayout'
import AuthLayout   from '@/components/layout/AuthLayout'

// User Pages
import Home         from '@/pages/Home'
import Search       from '@/pages/Search'
import HotelDetail  from '@/pages/HotelDetail'
import Checkout     from '@/pages/Checkout'
import Payment      from '@/pages/Payment'
import OrderHistory from '@/pages/OrderHistory'
import Profile      from '@/pages/Profile'

// Auth Pages
import Login        from '@/pages/Auth/Login'
import Register     from '@/pages/Auth/Register'

// Admin Pages
import Dashboard    from '@/pages/admin/Dashboard'
import AdminHotels  from '@/pages/admin/Hotels'
import AdminOrders  from '@/pages/admin/Orders'
import AdminReports from '@/pages/admin/Reports'
import AdminUsers   from '@/pages/admin/Users'
import AdminPromos  from '@/pages/admin/Promos'

// Guards
function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children, roles = [] }) {
  const { token, user } = useAuthStore()
  if (!token)                           return <Navigate to="/login" replace />
  const adminRoles = ['superadmin','admin','admin_property','finance','owner']
  if (!adminRoles.includes(user?.role)) return <Navigate to="/" replace />
  if (roles.length && !roles.includes(user?.role)) return <Navigate to="/admin" replace />
  return children
}

function GuestRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <>
      <Routes>
        {/* ── Public / User ──────────────────────────────── */}
        <Route element={<UserLayout />}>
          <Route path="/"                  element={<Home />} />
          <Route path="/search"            element={<Search />} />
          <Route path="/hotel/:id"         element={<HotelDetail />} />
          <Route path="/checkout/:roomId"  element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="/payment/:bookingId" element={<PrivateRoute><Payment /></PrivateRoute>} />
          <Route path="/orders"            element={<PrivateRoute><OrderHistory /></PrivateRoute>} />
          <Route path="/profile"           element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/dashboard"          element={<PrivateRoute><OrderHistory /></PrivateRoute>} />
        </Route>

        {/* ── Auth ───────────────────────────────────────── */}
        <Route element={<AuthLayout />}>
          <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        </Route>

        {/* ── Admin ──────────────────────────────────────── */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index                element={<Dashboard />} />
          <Route path="hotels"        element={<AdminHotels />} />
          <Route path="orders"        element={<AdminOrders />} />
          <Route path="reports"       element={<AdminReports />} />
          <Route path="users"         element={<AdminUsers />} />
          <Route path="promos"        element={<AdminPromos />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster />
    </>
  )
}
