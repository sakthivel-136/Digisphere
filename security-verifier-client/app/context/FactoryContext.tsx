'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { getFactories } from '@/app/api/factories.api';

export interface Factory {
  factory_code: string;
  factory_name: string;
  location?: string | null;
  factory_address?: string | null;
}

interface FactoryContextType {
  factories: Factory[];
  selectedFactory: string;
  selectedFactoryName: string;
  selectedFactoryObj: Factory | null;
  setSelectedFactory: (factoryCode: string) => void;
  isLoading: boolean;
  refreshFactories: () => Promise<void>;
}

const STORAGE_KEY = 'pentagon_selected_factory_code';

export const DEFAULT_FACTORIES: Factory[] = [
  { factory_code: 'F001', factory_name: 'GJ Innovations and Textile Network Pvt. Ltd.', location: 'Sulakkarai' },
  { factory_code: 'F002', factory_name: 'Pentagon Apparels - I', location: 'Virudhunagar' },
  { factory_code: 'F003', factory_name: 'Pentagon Apparels - II', location: 'Pavali' },
  { factory_code: 'F004', factory_name: 'Pentagon Garments', location: 'Rajapalayam' },
  { factory_code: 'MD001', factory_name: 'MD Sir House', location: 'Virudhunagar' },
];

const FactoryContext = createContext<FactoryContextType | undefined>(undefined);

export function FactoryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [factories, setFactories] = useState<Factory[]>(DEFAULT_FACTORIES);
  const [selectedFactory, setSelectedFactoryState] = useState<string>('F001');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load factories from API
  const refreshFactories = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('access_token');
    // If not authenticated, do not fire protected API requests
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res: any = await getFactories();
      let list: Factory[] = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      } else if (Array.isArray(res?.data?.data)) {
        list = res.data.data;
      }

      if (list && list.length > 0) {
        setFactories(list);

        // Check if there is an existing stored selection
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && list.some((f) => f.factory_code === stored)) {
          setSelectedFactoryState(stored);
        } else {
          // If F001 exists in list, prefer F001; otherwise first item
          const defaultFactory = list.find((f) => f.factory_code === 'F001') || list[0];
          setSelectedFactoryState(defaultFactory.factory_code);
          localStorage.setItem(STORAGE_KEY, defaultFactory.factory_code);
        }
      } else {
        // Fallback to defaults if response was empty
        setFactories((prev) => (prev && prev.length > 0 ? prev : DEFAULT_FACTORIES));
      }
    } catch (err) {
      console.warn('Failed to load factories in FactoryProvider:', err);
      // Fallback defaults if offline or error
      setFactories((prev) => (prev && prev.length > 0 ? prev : DEFAULT_FACTORIES));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount, path change, or login events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSelectedFactoryState(stored);
    }

    refreshFactories();

    const handleLoginSuccess = () => {
      refreshFactories();
    };

    window.addEventListener('auth-login-success', handleLoginSuccess);
    window.addEventListener('storage', handleLoginSuccess);
    return () => {
      window.removeEventListener('auth-login-success', handleLoginSuccess);
      window.removeEventListener('storage', handleLoginSuccess);
    };
  }, [refreshFactories, pathname]);

  const setSelectedFactory = useCallback((code: string) => {
    if (!code) return;
    setSelectedFactoryState(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, code);
      window.dispatchEvent(new CustomEvent('factory-changed', { detail: { factoryCode: code } }));
    }
  }, []);

  const selectedFactoryObj = useMemo(() => {
    return factories.find((f) => f.factory_code === selectedFactory) || null;
  }, [factories, selectedFactory]);

  const selectedFactoryName = useMemo(() => {
    if (selectedFactoryObj) {
      return selectedFactoryObj.factory_name;
    }
    return selectedFactory;
  }, [selectedFactoryObj, selectedFactory]);

  const value = useMemo(
    () => ({
      factories,
      selectedFactory,
      selectedFactoryName,
      selectedFactoryObj,
      setSelectedFactory,
      isLoading,
      refreshFactories,
    }),
    [factories, selectedFactory, selectedFactoryName, selectedFactoryObj, setSelectedFactory, isLoading, refreshFactories]
  );

  return <FactoryContext.Provider value={value}>{children}</FactoryContext.Provider>;
}

export function useFactory() {
  const context = useContext(FactoryContext);
  if (!context) {
    throw new Error('useFactory must be used within a FactoryProvider');
  }
  return context;
}
