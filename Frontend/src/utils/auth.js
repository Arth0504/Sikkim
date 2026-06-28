export const getToken = () => {
  return sessionStorage.getItem("adminToken") || sessionStorage.getItem("userToken") || localStorage.getItem("adminToken") || localStorage.getItem("userToken");
};

export const getRole = () => {
  return sessionStorage.getItem("role") || localStorage.getItem("role");
};

export const logout = () => {
  sessionStorage.clear();
  localStorage.clear();
  window.location.href = "/login";
};
