import { useState } from 'react';

const useToast = () => {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const hideToast = (id) => {
    setToast(null);
  };

  return { toast, showToast, hideToast };
};

export default useToast;
