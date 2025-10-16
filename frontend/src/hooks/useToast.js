import { useState } from 'react';

const TOAST_TIMEOUT = 3000;

export function useToast() {
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), TOAST_TIMEOUT);
    };

    return { toast, showToast };
}