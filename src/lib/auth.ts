export async function logout() {
  try {
    // Clear all auth-related cookies
    const cookiesToClear = ["__session", "auth_error"];
    
    cookiesToClear.forEach(cookieName => {
      // Clear cookie with all possible paths and domains
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    });

    // Clear any stored tokens or auth state
    localStorage.removeItem("authState");
    sessionStorage.removeItem("authState");
    
    // Redirect to login page with a clean URL
    window.location.href = "/login";
  } catch (error) {
    console.error("Error during logout:", error);
    // Fallback: force redirect to login
    window.location.href = "/login";
  }
} 