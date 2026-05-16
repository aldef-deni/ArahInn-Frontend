const MANAGEMENT_ROLES = ['superadmin', 'admin', 'admin_property', 'finance', 'design_interior']
const OWNER_ROLES = ['owner']

export const isManagementPortal = () => {
  const host = window.location.hostname
  return host === 'kelola.arahinn.com' || host.startsWith('kelola.')
}

export const isOwnerPortal = () => {
  const host = window.location.hostname
  return host === 'extranet.arahinn.com' || host.startsWith('extranet.')
}

export const isExtranet = () => isManagementPortal() || isOwnerPortal()

export const isManagementRole = (role) => MANAGEMENT_ROLES.includes(role)
export const isOwnerRole = (role) => OWNER_ROLES.includes(role)

export const getCustomerPortalUrl = () => (
  (import.meta.env.VITE_CUSTOMER_URL || 'https://staging.arahinn.com').replace(/\/$/, '')
)

export const getManagementPortalUrl = (path = '/login') => {
  const base = (import.meta.env.VITE_MANAGER_URL || 'https://kelola.arahinn.com').replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

export const getOwnerPortalUrl = (path = '/login') => {
  const base = (import.meta.env.VITE_OWNER_URL || 'https://extranet.arahinn.com').replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}
