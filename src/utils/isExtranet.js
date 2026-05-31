const MANAGEMENT_ROLES = ['superadmin', 'admin', 'admin_property', 'finance', 'design_interior']
const OWNER_ROLES = ['owner']

export const isManagementPortal = () => {
  const host = window.location.hostname
  return host === 'kelola.arahinn.com' || host.startsWith('kelola.')
}

export const isOwnerPortal = () => {
  const host = window.location.hostname
  // New canonical: my.arahinn.com. Old extranet.arahinn.com tetap di-handle
  // selama transition period.
  return (
    host === 'my.arahinn.com' || host.startsWith('my.') ||
    host === 'extranet.arahinn.com' || host.startsWith('extranet.')
  )
}

export const isExtranet = () => isManagementPortal() || isOwnerPortal()

// Terima single role string ATAU array of roles (user bisa punya multi-role)
const _asArray = (input) => Array.isArray(input) ? input : (input ? [input] : [])

export const isManagementRole = (input) =>
  _asArray(input).some(r => MANAGEMENT_ROLES.includes(r))

export const isOwnerRole = (input) =>
  _asArray(input).some(r => OWNER_ROLES.includes(r))

// Convenience: terima user object → cek dari user.roles[] (multi-role) ATAU user.role (fallback)
export const userHasOwnerRole = (user) =>
  isOwnerRole(user?.roles || user?.role)

export const userHasManagementRole = (user) =>
  isManagementRole(user?.roles || user?.role)

export const getCustomerPortalUrl = () => (
  (import.meta.env.VITE_CUSTOMER_URL || 'https://arahinn.com').replace(/\/$/, '')
)

export const getManagementPortalUrl = (path = '/login') => {
  const base = (import.meta.env.VITE_MANAGER_URL || 'https://kelola.arahinn.com').replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

export const getOwnerPortalUrl = (path = '/login') => {
  const base = (import.meta.env.VITE_OWNER_URL || 'https://my.arahinn.com').replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}
