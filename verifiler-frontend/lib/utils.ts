/**
 * A utility function for conditionally joining class names together
 * Combines clsx for conditional classes and tailwind-merge for proper Tailwind CSS class merging
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(" ")
}



/**
 * Truncates a string to a specified length and adds an ellipsis
 */
export function truncateString(str: string, maxLength = 10): string {
    if (str.length <= maxLength) return str
    return `${str.slice(0, maxLength)}...`
}

/**
 * Formats a file size in bytes to a human-readable string
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Formats a blockchain address to a shortened form
 */
export function formatAddress(address: string): string {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Validates if a file is within the allowed types and size limit
 */
export function validateFile(file: File, allowedTypes: string[] = [], maxSizeInMB = 10): boolean {
    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024)
    if (fileSizeInMB > maxSizeInMB) return false

    // If no specific types are required, just check size
    if (allowedTypes.length === 0) return true

    // Check file type
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || ""
    return allowedTypes.includes(fileExtension)
}