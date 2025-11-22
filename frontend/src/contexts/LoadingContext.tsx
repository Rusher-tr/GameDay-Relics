import { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
    isLoading: boolean;
    showLoading: () => void;
    hideLoading: () => void;
    withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);

    const showLoading = () => setIsLoading(true);
    const hideLoading = () => setIsLoading(false);

    // Wrapper function to automatically show/hide loading for async operations
    const withLoading = async <T,>(fn: () => Promise<T>): Promise<T> => {
        showLoading();
        try {
            const result = await fn();
            return result;
        } finally {
            hideLoading();
        }
    };

    return (
        <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading, withLoading }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within LoadingProvider');
    }
    return context;
}
