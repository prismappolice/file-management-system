// Clean up any stored passwords from localStorage for security
const cleanupScript = () => {
  try {
    // Remove any stored password data
    localStorage.removeItem('userPasswords')
    console.log('✅ Cleaned up stored password data for security')
    
    // Also check for any other password-related storage
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.toLowerCase().includes('password') || key.toLowerCase().includes('pass')) {
        localStorage.removeItem(key)
        console.log(`✅ Removed insecure storage: ${key}`)
      }
    })
    
    console.log('🔒 Security cleanup completed')
  } catch (error) {
    console.error('Error during security cleanup:', error)
  }
}

// Run cleanup immediately
cleanupScript()

// Export for use in browser console if needed
window.cleanupPasswords = cleanupScript