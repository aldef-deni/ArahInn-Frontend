import { useEffect } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { useAuthStore } from '@/store/authStore'
import { maintenanceApi, authApi } from '@/services/index'

// Layouts
import UserLayout from '@/components/layout/UserLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import OwnerLayout from '@/components/layout/OwnerLayout'

// User Pages
import Home from '@/pages/Home'
import Search from '@/pages/Search'
import HotelDetail from '@/pages/HotelDetail'
import Checkout from '@/pages/Checkout'
import Payment from '@/pages/Payment'
import OrderHistory from '@/pages/OrderHistory'
import OrderDetail from '@/pages/OrderDetail'
import Profile from '@/pages/Profile'
import PropertyMarket from '@/pages/PropertyMarket'
import PropertyDetail from '@/pages/PropertyDetail'
import InteriorPage from '@/pages/Interior'
import PromoPage from '@/pages/Promo'
import Sports from '@/pages/Sports'
import ComingSoon from '@/pages/ComingSoon'
import PpobLanding from '@/pages/Ppob/PpobLanding'
import PpobCategoryPage from '@/pages/Ppob/PpobCategoryPage'
import PpobHistory from '@/pages/Ppob/PpobHistory'
import PpobPayment from '@/pages/Ppob/PpobPayment'
import TravelLanding from '@/pages/Travel/TravelLanding'
import TravelEmbed from '@/pages/Travel/TravelEmbed'
import TrainSearch from '@/pages/Travel/TrainSearch'
import TrainBooking from '@/pages/Travel/TrainBooking'
import FlightSearch from '@/pages/Travel/FlightSearch'
import FlightBooking from '@/pages/Travel/FlightBooking'
import PelniSearch from '@/pages/Travel/PelniSearch'
import PelniBooking from '@/pages/Travel/PelniBooking'
import TravelPayment from '@/pages/Travel/TravelPayment'
import Maintenance from '@/pages/Maintenance'
import AdminPpob from '@/pages/admin/Ppob'
import AdminTravel from '@/pages/admin/Travel'
import TermsAndConditions from '@/pages/Legal/TermsAndConditions'
import PrivacyPolicy from '@/pages/Legal/PrivacyPolicy'
import AccountDeletion from '@/pages/Legal/AccountDeletion'

// Auth Pages
import Login from '@/pages/Auth/Login'
import LoginExtranet from '@/pages/Auth/LoginExtranet'
import RegisterExtranet from '@/pages/Auth/RegisterExtranet'
import Register from '@/pages/Auth/Register'
import AuthCallback from '@/pages/Auth/Callback'

import {
  getCustomerPortalUrl,
  getManagementPortalUrl,
  getOwnerPortalUrl,
  isExtranet,
  isManagementRole,
  isManagementPortal,
  isOwnerPortal,
  isOwnerRole,
} from '@/utils/isExtranet'

const extranetMode = isExtranet()
const managementMode = isManagementPortal()
const ownerMode = isOwnerPortal()

// Admin Pages
import Dashboard from '@/pages/admin/Dashboard'
import AdminHotels from '@/pages/admin/Hotels'
import AdminOrders from '@/pages/admin/Orders'
import AdminReports from '@/pages/admin/Reports'
import AdminAnalytics from '@/pages/admin/Analytics'
import AdminSettings from '@/pages/admin/Settings'
import AdminUsers from '@/pages/admin/Users'
import AdminPromos from '@/pages/admin/Promos'
import AdminCampaigns from '@/pages/admin/Campaigns'
import AdminPropertyApproval from '@/pages/admin/PropertyApproval'
import AdminReviews from '@/pages/admin/Reviews'

// Admin Pricing
import AdminHarga from '@/pages/admin/Harga'

// Finance Pages
import FinanceInvoices from '@/pages/admin/Finance/Invoices'
import FinanceProfit from '@/pages/admin/Finance/Profit'

// Owner Management
import AdminOwners from '@/pages/admin/Owners'
import AdminMMHandler from '@/pages/admin/MMHandler'

// Owner Pages
import OwnerPropertySale from '@/pages/owner/PropertySale'
import OwnerDashboard from '@/pages/owner/Dashboard'
import OwnerPropertiDetail from '@/pages/owner/Properti'
import OwnerPropertiUnit from '@/pages/owner/Properti/Unit'
import OwnerPropertiGaleri from '@/pages/owner/Properti/Galeri'
import OwnerPropertiFasilitas from '@/pages/owner/Properti/Fasilitas'
import OwnerHargaPricingModel from '@/pages/owner/Harga/PricingModel'
import OwnerHargaRatePlan from '@/pages/owner/Harga/RatePlan'
import OwnerHargaRatePlanForm from '@/pages/owner/Harga/RatePlanForm'
import OwnerHargaAnak from '@/pages/owner/Harga/HargaAnak'
import OwnerHargaAtur from '@/pages/owner/Harga/AturHarga'
import OwnerHargaBulk from '@/pages/owner/Harga/BulkUpdate'
import OwnerHargaBiaya from '@/pages/owner/Harga/BiayaTambahan'
import OwnerHargaNow from '@/pages/owner/Harga/KetersediaanNow'
import OwnerPromo from '@/pages/owner/Promo'
import OwnerCampaign from '@/pages/owner/Campaign'
import OwnerPesanan from '@/pages/owner/Pesanan'
import OwnerLaporan from '@/pages/owner/Laporan'
import OwnerChat from '@/pages/owner/Chat'
import OwnerDaftarHotel from '@/pages/owner/Properti/DaftarHotel'
import OwnerDaftarHotelPage from '@/pages/owner/Properti/DaftarHotelPage'
import AdminInterior from '@/pages/admin/Interior'
import AdminCustomerChat from '@/pages/admin/CustomerChat'
import DesignInteriorDashboard from '@/pages/admin/Interior/Dashboard'

function ExternalRedirect({ to }) {
  useEffect(() => {
    window.location.replace(to)
  }, [to])

  return null
}

// Internal redirect yang preserve dynamic param (mis. /ppob/:group → /topup-tagihan/:group)
function RedirectWithParams({ to, param }) {
  const params = useParams()
  const value = params[param] || ''
  return <Navigate to={`${to}/${value}`} replace />
}

function DashboardSwitch() {
  const role = useAuthStore(s => s.user?.role)
  if (role === 'design_interior') return <DesignInteriorDashboard />
  return <Dashboard />
}

function BlockRoles({ roles = [], children }) {
  const role = useAuthStore(s => s.user?.role)
  if (roles.includes(role)) return <Navigate to="/admin" replace />
  return children
}

// Guards
function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children, roles = [] }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  const adminRoles = ['superadmin', 'admin', 'admin_property', 'finance', 'design_interior']
  if (!adminRoles.includes(user?.role)) {
    if (user?.role === 'owner') return <ExternalRedirect to={getOwnerPortalUrl('/owner')} />
    if (user?.role === 'user') return <ExternalRedirect to={getCustomerPortalUrl()} />
    return <Navigate to="/login" replace />
  }
  if (!managementMode) {
    return <ExternalRedirect to={getManagementPortalUrl('/admin')} />
  }
  if (roles.length && !roles.includes(user?.role)) return <Navigate to="/admin" replace />
  return children
}

function OwnerRoute({ children }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'owner') {
    if (isManagementRole(user?.role)) return <ExternalRedirect to={getManagementPortalUrl('/admin')} />
    return <ExternalRedirect to={getCustomerPortalUrl()} />
  }
  if (!ownerMode) {
    return <ExternalRedirect to={getOwnerPortalUrl('/owner')} />
  }
  return children
}

function GuestRoute({ children }) {
  const { token, user } = useAuthStore()
  if (!token) return children

  if (managementMode) {
    if (isManagementRole(user?.role)) {
      return <Navigate to="/admin" replace />
    }
    if (isOwnerRole(user?.role)) {
      return <ExternalRedirect to={getOwnerPortalUrl('/owner')} />
    }
    return <ExternalRedirect to={getCustomerPortalUrl()} />
  }

  if (ownerMode) {
    if (isOwnerRole(user?.role)) {
      return <Navigate to="/owner" replace />
    }
    if (isManagementRole(user?.role)) {
      return <ExternalRedirect to={getManagementPortalUrl('/admin')} />
    }
    return <ExternalRedirect to={getCustomerPortalUrl()} />
  }

  if (isManagementRole(user?.role)) {
    return <ExternalRedirect to={getManagementPortalUrl('/admin')} />
  }

  if (isOwnerRole(user?.role)) {
    return <ExternalRedirect to={getOwnerPortalUrl('/owner')} />
  }

  return <Navigate to="/" replace />
}

export default function App() {
  // Token handoff dari app My ArahInn: jika URL punya ?app_token=...,
  // auto-login (tanpa minta login lagi) lalu strip param dari URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const appToken = params.get('app_token')
    if (!appToken) return
    params.delete('app_token')
    const qs = params.toString()
    const clean = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash
    window.history.replaceState({}, '', clean)
    const store = useAuthStore.getState()
    store.setAuth(store.user, appToken, null)   // set token → interceptor pakai ini
    authApi.me()
      .then(r => {
        const u = r.data?.data?.user ?? r.data?.data ?? r.data?.user ?? r.data
        store.setAuth(u, appToken, null)
      })
      .catch(() => { /* token invalid → biarkan flow login normal */ })
  }, [])

  // Maintenance mode runtime check — admin toggle via /admin/settings.
  // Refresh tiap 30 detik supaya toggle cepat propagate ke customer.
  // Staging memakai backend yang sama dgn produksi → kecualikan dari maintenance.
  // Maintenance hanya berlaku untuk host produksi (arahinn.com), bukan staging/preview/localhost.
  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  const isNonProdHost = /(^|\.)staging\.|^staging\.|preview\.|localhost|127\.0\.0\.1|\.local$/i.test(host)
  const { data: mData } = useQuery({
    queryKey: ['maintenance-status'],
    queryFn : () => maintenanceApi.status().then(r => r.data?.data ?? { enabled: false }),
    refetchInterval: 30_000,
    staleTime: 20_000,
    enabled: !isNonProdHost,
  })
  const maintenanceMode = !isNonProdHost && !!mData?.enabled

  return (
    <>
      <Routes>
        {extranetMode && <Route path="/" element={<Navigate to="/login" replace />} />}

        {!extranetMode && maintenanceMode && (
          <>
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/account-deletion" element={<AccountDeletion />} />
            <Route path="/hapus-akun" element={<AccountDeletion />} />
            {/* Semua customer routes lain → Maintenance. Admin/login tetap accessible
                karena route mereka lebih spesifik dari "*". */}
            <Route path="*" element={<Maintenance />} />
          </>
        )}

        {!extranetMode && !maintenanceMode && (
          <Route element={<UserLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/hotel/:id" element={<HotelDetail />} />
            <Route path="/properti" element={<PropertyMarket />} />
            <Route path="/properti/:id" element={<PropertyDetail />} />
            <Route path="/interior" element={<InteriorPage />} />
            <Route path="/promo" element={<PromoPage />} />
            <Route path="/sports" element={<Sports />} />
            <Route path="/coming-soon" element={<ComingSoon />} />
            {/* Top Up & Tagihan — canonical URL */}
            <Route path="/topup-tagihan" element={<PpobLanding />} />
            <Route path="/topup-tagihan/history" element={<PrivateRoute><PpobHistory /></PrivateRoute>} />
            <Route path="/topup-tagihan/pay/:trxCode" element={<PrivateRoute><PpobPayment /></PrivateRoute>} />
            <Route path="/topup-tagihan/:group" element={<PpobCategoryPage />} />
            {/* Legacy /ppob/* → redirect ke /topup-tagihan/* untuk preserve bookmark */}
            <Route path="/ppob" element={<Navigate to="/topup-tagihan" replace />} />
            <Route path="/ppob/history" element={<Navigate to="/topup-tagihan/history" replace />} />
            <Route path="/ppob/pay/:trxCode" element={<RedirectWithParams to="/topup-tagihan/pay" param="trxCode" />} />
            <Route path="/ppob/:group" element={<RedirectWithParams to="/topup-tagihan" param="group" />} />
            <Route path="/tiket" element={<TravelLanding />} />
            {/* Kereta — API langsung (search publik, booking butuh login) */}
            <Route path="/tiket/kereta" element={<TrainSearch />} />
            <Route path="/tiket/kereta/pesan" element={<PrivateRoute><TrainBooking /></PrivateRoute>} />
            {/* Pesawat — API langsung */}
            <Route path="/tiket/pesawat" element={<FlightSearch />} />
            <Route path="/tiket/pesawat/pesan" element={<PrivateRoute><FlightBooking /></PrivateRoute>} />
            {/* Pelni — API langsung */}
            <Route path="/tiket/pelni" element={<PelniSearch />} />
            <Route path="/tiket/pelni/pesan" element={<PrivateRoute><PelniBooking /></PrivateRoute>} />
            {/* Pembayaran travel (kereta + pesawat + pelni) */}
            <Route path="/tiket/bayar/:id" element={<PrivateRoute><TravelPayment /></PrivateRoute>} />
            {/* DLU sementara masih embed/landing */}
            <Route path="/tiket/:page" element={<PrivateRoute><TravelEmbed /></PrivateRoute>} />
            <Route path="/checkout/:roomId" element={<PrivateRoute><Checkout /></PrivateRoute>} />
            <Route path="/payment/:bookingId" element={<PrivateRoute><Payment /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute><OrderHistory /></PrivateRoute>} />
            <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><OrderHistory /></PrivateRoute>} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/syarat-ketentuan" element={<TermsAndConditions />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/kebijakan-privasi" element={<PrivacyPolicy />} />
            <Route path="/account-deletion" element={<AccountDeletion />} />
            <Route path="/hapus-akun" element={<AccountDeletion />} />
            {/* SEO-friendly hotel detail URL: /<kategori>/<slug> — placed LAST so static routes win */}
            <Route path="/:category/:slug" element={<HotelDetail />} />
          </Route>
        )}

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<GuestRoute>{extranetMode ? <LoginExtranet /> : <Login />}</GuestRoute>} />
          {/* Register: owner portal pakai RegisterExtranet, customer pakai Register biasa, management tidak ada */}
          {(ownerMode || !extranetMode) && (
            <Route path="/register" element={
              <GuestRoute>{ownerMode ? <RegisterExtranet /> : <Register />}</GuestRoute>
            } />
          )}
        </Route>

        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<DashboardSwitch />} />
          <Route path="profile" element={<Profile />} />
          <Route path="hotels" element={<BlockRoles roles={['design_interior']}><AdminHotels /></BlockRoles>} />
          <Route path="hotels/new-full" element={<BlockRoles roles={['design_interior']}><OwnerDaftarHotel /></BlockRoles>} />
          <Route path="hotels/:id/edit" element={<BlockRoles roles={['design_interior']}><OwnerDaftarHotel /></BlockRoles>} />
          <Route path="orders" element={<BlockRoles roles={['design_interior']}><AdminOrders /></BlockRoles>} />
          <Route path="reports" element={<BlockRoles roles={['design_interior']}><AdminReports /></BlockRoles>} />
          <Route path="analytics" element={<BlockRoles roles={['design_interior']}><AdminAnalytics /></BlockRoles>} />
          <Route path="settings" element={<AdminRoute roles={['superadmin']}><AdminSettings /></AdminRoute>} />
          <Route path="users" element={<BlockRoles roles={['design_interior']}><AdminUsers /></BlockRoles>} />
          <Route path="promos" element={<BlockRoles roles={['design_interior']}><AdminPromos /></BlockRoles>} />
          <Route path="campaigns" element={<BlockRoles roles={['design_interior']}><AdminCampaigns /></BlockRoles>} />
          <Route path="finance/invoices" element={<BlockRoles roles={['design_interior']}><FinanceInvoices /></BlockRoles>} />
          <Route path="finance/profit" element={<BlockRoles roles={['design_interior', 'admin']}><FinanceProfit /></BlockRoles>} />
          <Route path="owners" element={<BlockRoles roles={['design_interior']}><AdminOwners /></BlockRoles>} />
          <Route path="mm-handler" element={<BlockRoles roles={['design_interior']}><AdminMMHandler /></BlockRoles>} />
          <Route path="property-approval" element={<BlockRoles roles={['design_interior']}><AdminPropertyApproval /></BlockRoles>} />
          <Route path="reviews" element={<BlockRoles roles={['design_interior']}><AdminReviews /></BlockRoles>} />
          <Route path="interior" element={<AdminInterior />} />
          <Route path="ppob" element={<AdminPpob />} />
          <Route path="travel" element={<AdminTravel />} />
          <Route path="customer-chat" element={<BlockRoles roles={['design_interior']}><AdminCustomerChat /></BlockRoles>} />
          <Route path="harga" element={<BlockRoles roles={['design_interior']}><AdminHarga /></BlockRoles>}>
            <Route index element={<Navigate to="pricing-model" replace />} />
            <Route path="pricing-model" element={<OwnerHargaPricingModel />} />
            <Route path="rate-plan" element={<OwnerHargaRatePlan />} />
            <Route path="rate-plan/new" element={<OwnerHargaRatePlanForm />} />
            <Route path="rate-plan/:id/edit" element={<OwnerHargaRatePlanForm />} />
            <Route path="harga-anak" element={<OwnerHargaAnak />} />
            <Route path="atur" element={<OwnerHargaAtur />} />
            <Route path="bulk-update" element={<OwnerHargaBulk />} />
            <Route path="biaya-tambahan" element={<OwnerHargaBiaya />} />
            <Route path="ketersediaan-now" element={<OwnerHargaNow />} />
          </Route>
        </Route>

        <Route path="/owner" element={<OwnerRoute><OwnerLayout /></OwnerRoute>}>
          <Route index element={<OwnerDashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="properti" element={<OwnerPropertiDetail />} />
          <Route path="properti/unit" element={<OwnerPropertiUnit />} />
          <Route path="properti/galeri" element={<OwnerPropertiGaleri />} />
          <Route path="properti/fasilitas" element={<OwnerPropertiFasilitas />} />
          <Route path="harga">
            <Route index element={<Navigate to="pricing-model" replace />} />
            <Route path="pricing-model" element={<OwnerHargaPricingModel />} />
            <Route path="rate-plan" element={<OwnerHargaRatePlan />} />
            <Route path="rate-plan/new" element={<OwnerHargaRatePlanForm />} />
            <Route path="rate-plan/:id/edit" element={<OwnerHargaRatePlanForm />} />
            <Route path="harga-anak" element={<OwnerHargaAnak />} />
            <Route path="atur" element={<OwnerHargaAtur />} />
            <Route path="bulk-update" element={<OwnerHargaBulk />} />
            <Route path="biaya-tambahan" element={<OwnerHargaBiaya />} />
            <Route path="ketersediaan-now" element={<OwnerHargaNow />} />
          </Route>
          <Route path="promo" element={<OwnerPromo />} />
          <Route path="campaign" element={<OwnerCampaign />} />
          <Route path="pesanan" element={<OwnerPesanan />} />
          <Route path="laporan" element={<OwnerLaporan />} />
          <Route path="chat" element={<OwnerChat />} />
          <Route path="daftar-hotel" element={<OwnerDaftarHotel />} />
          <Route path="jual-properti" element={<OwnerPropertySale />} />
        </Route>

        <Route path="/daftar-hotel-baru" element={<OwnerRoute><OwnerDaftarHotelPage /></OwnerRoute>} />

        <Route path="*" element={<Navigate to={extranetMode ? '/login' : '/'} replace />} />
      </Routes>

      <Toaster />
    </>
  )
}
