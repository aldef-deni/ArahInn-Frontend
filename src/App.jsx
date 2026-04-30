import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { useAuthStore } from '@/store/authStore'

// Layouts
import UserLayout   from '@/components/layout/UserLayout'
import AdminLayout  from '@/components/layout/AdminLayout'
import AuthLayout   from '@/components/layout/AuthLayout'
import OwnerLayout  from '@/components/layout/OwnerLayout'

// User Pages
import Home         from '@/pages/Home'
import Search       from '@/pages/Search'
import HotelDetail  from '@/pages/HotelDetail'
import Checkout     from '@/pages/Checkout'
import Payment      from '@/pages/Payment'
import OrderHistory from '@/pages/OrderHistory'
import Profile      from '@/pages/Profile'

// Auth Pages
import Login          from '@/pages/Auth/Login'
import LoginExtranet  from '@/pages/Auth/LoginExtranet'
import Register       from '@/pages/Auth/Register'
import AuthCallback   from '@/pages/Auth/Callback'

import { isExtranet } from '@/utils/isExtranet'
const extranetMode = isExtranet()

// Admin Pages
import Dashboard    from '@/pages/admin/Dashboard'
import AdminHotels  from '@/pages/admin/Hotels'
import AdminOrders  from '@/pages/admin/Orders'
import AdminReports from '@/pages/admin/Reports'
import AdminUsers   from '@/pages/admin/Users'
import AdminPromos  from '@/pages/admin/Promos'

// Owner Pages
import OwnerDashboard    from '@/pages/owner/Dashboard'
import OwnerPropertiDetail   from '@/pages/owner/Properti'
import OwnerPropertiUnit     from '@/pages/owner/Properti/Unit'
import OwnerPropertiGaleri   from '@/pages/owner/Properti/Galeri'
import OwnerPropertiFasilitas from '@/pages/owner/Properti/Fasilitas'
import OwnerHarga        from '@/pages/owner/Harga'
import OwnerPromo        from '@/pages/owner/Promo'
import OwnerPesanan      from '@/pages/owner/Pesanan'
import OwnerLaporan      from '@/pages/owner/Laporan'
import OwnerChat         from '@/pages/owner/Chat'

// Guards
function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children, roles = [] }) {
  const { token, user } = useAuthStore()
  if (!token)                           return <Navigate to="/login" replace />
  const adminRoles = ['superadmin','admin','admin_property','finance']
  if (!adminRoles.includes(user?.role)) return <Navigate to="/" replace />
  if (roles.length && !roles.includes(user?.role)) return <Navigate to="/admin" replace />
  return children
}

function OwnerRoute({ children }) {
  const { token, user } = useAuthStore()
  if (!token)              return <Navigate to="/login" replace />
  if (user?.role !== 'owner') return <Navigate to="/" replace />
  return children
}

function GuestRoute({ children }) {
  const { token, user } = useAuthStore()
  if (!token) return children
  if (extranetMode) return <Navigate to="/owner" replace />
  const adminRoles = ['superadmin', 'admin', 'finance']
  if (user?.role && adminRoles.includes(user.role)) return <Navigate to="/admin" replace />
  return <Navigate to="/" replace />
}

export default function App() {
  return (
    <>
      <Routes>
        {/* ── Extranet root → /login ─────────────────────── */}
        {extranetMode && <Route path="/" element={<Navigate to="/login" replace />} />}

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
          <Route path="/login" element={
            <GuestRoute>{extranetMode ? <LoginExtranet /> : <Login />}</GuestRoute>
          } />
          {!extranetMode && (
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          )}
        </Route>

        {/* ── OAuth Callback ─────────────────────────────── */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* ── Admin ──────────────────────────────────────── */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index                element={<Dashboard />} />
          <Route path="hotels"        element={<AdminHotels />} />
          <Route path="orders"        element={<AdminOrders />} />
          <Route path="reports"       element={<AdminReports />} />
          <Route path="users"         element={<AdminUsers />} />
          <Route path="promos"        element={<AdminPromos />} />
        </Route>

        {/* ── Owner Extranet ─────────────────────────────── */}
        <Route path="/owner" element={<OwnerRoute><OwnerLayout /></OwnerRoute>}>
          <Route index                     element={<OwnerDashboard />} />
          <Route path="properti"           element={<OwnerPropertiDetail />} />
          <Route path="properti/unit"      element={<OwnerPropertiUnit />} />
          <Route path="properti/galeri"    element={<OwnerPropertiGaleri />} />
          <Route path="properti/fasilitas" element={<OwnerPropertiFasilitas />} />
          <Route path="harga"              element={<OwnerHarga />} />
          <Route path="promo"              element={<OwnerPromo />} />
          <Route path="pesanan"            element={<OwnerPesanan />} />
          <Route path="laporan"            element={<OwnerLaporan />} />
          <Route path="chat"               element={<OwnerChat />} />
        </Route>

        <Route path="*" element={<Navigate to={extranetMode ? '/owner' : '/'} replace />} />
      </Routes>

      <Toaster />
    </>
  )
}
