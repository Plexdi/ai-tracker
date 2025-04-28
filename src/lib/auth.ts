export async function logout() {
  try {
    // Clear the session cookie
    document.cookie = "__session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Redirect to login page
    window.location.href = "/login";
  } catch (error) {
    console.error("Error during logout:", error);
  }
} 