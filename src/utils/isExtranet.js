export const isExtranet = () => {
  const host = window.location.hostname
  return host === 'extranet.arahinn.com' || host.startsWith('extranet.')
}
