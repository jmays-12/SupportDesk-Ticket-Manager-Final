/**
 * Format a date string to a readable format
 * @param {string} dateString - ISO date string from API
 * @returns {string} - Formatted date like "Jan 15, 2024"
 */
export function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

/**
 * Format a date string to include time
 * @param {string} dateString - ISO date string from API
 * @returns {string} - Formatted like "Jan 15, 2024 at 2:30 PM"
 */
export function formatDateTime(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

/**
 * Format a date as a relative time like "2 hours ago"
 * @param {string} dateString - ISO date string from API
 * @returns {string} - Relative time or fallback to regular date
 */
export function formatRelativeTime(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    // Fall back to regular date
    return formatDate(dateString)
}