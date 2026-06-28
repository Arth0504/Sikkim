import toast from "react-hot-toast";

// Display success with fixed 2000ms duration and unique ID to prevent span-clicking identical toasts!
export const showSuccess = (message) => {
  toast.success(message, {
    duration: 2000,
    id: 'global-success-toast'
  });
};

// Display error with fixed 3000ms duration
export const showError = (message) => {
  toast.error(message, {
    duration: 3000,
    id: 'global-error-toast'
  });
};

// Returns a loader ID!
export const showLoading = (message) => {
  return toast.loading(message, {
    id: 'global-loading-toast'
  });
};

// For dismissing specific loading or arbitrary toasts
export const dismissToast = (id) => {
  toast.dismiss(id);
};

export const showWarning = (message) => {
  toast(message, {
    icon: '⚠️',
    duration: 3000,
    id: 'global-warning-toast'
  });
};
