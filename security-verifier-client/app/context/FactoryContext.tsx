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

const FactoryContext = createContext<FactoryContextType | undefined>(undefined);

export function FactoryProvider({ children }: { children: ReactNode }) {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [selectedFactory, setSelectedFactoryState] = useState<string>('F001');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load factories from API
  const refreshFactories = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: any = await getFactories();
      const list: Factory[] = Array.isArray(res) ? res : res?.data || [];

      if (list.length > 0) {
        setFactories(list);

        // Check if there is an existing stored selection
        const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        if (stored && list.some((f) => f.factory_code === stored)) {
          setSelectedFactoryState(stored);
        } else {
          // If F001 exists in list, prefer F001; otherwise first item
          const defaultFactory = list.find((f) => f.factory_code === 'F001') || list[0];
          setSelectedFactoryState(defaultFactory.factory_code);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, defaultFactory.factory_code);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load factories in FactoryProvider:', err);
      // Fallback defaults if offline
      const defaults: Factory[] = [
        { factory_code: 'F001', factory_name: 'GJ Innovations and Textile Network Pvt. Ltd.' },
        { factory_code: 'F002', factory_name: 'Pentagon Apparels - I' },
        { factory_code: 'F003', factory_name: 'Pentagon Apparels - II' },
        { factory_code: 'F004', factory_name: 'Pentagon Garments' },
        { factory_code: 'MD001', factory_name: 'MD Sir House' },
      ];
      setFactories(defaults);
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (stored && defaults.some((f) => f.factory_code === stored)) {
        setSelectedFactoryState(stored);
      } else {
        setSelectedFactoryState('F001');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      setSelectedFactoryState(stored);
    }
    refreshFactories();
  }, [refreshFactories]);

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
