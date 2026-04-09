/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SystemSettings {
  registrations_open: boolean;
  maintenance_mode: boolean;
}

interface SystemSettingsContextType {
  settings: SystemSettings | null;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const SystemSettingsContext = createContext<SystemSettingsContextType>({ 
  settings: null, 
  isLoading: true,
  refreshSettings: async () => {} 
});

export const SystemSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('system_settings').select('key, value');
      if (error) throw error;
      
      if (data) {
        setSettings({
          registrations_open: data.find(x => x.key === 'registrations_open')?.value !== 'false',
          maintenance_mode: data.find(x => x.key === 'maintenance_mode')?.value === 'true'
        });
      }
    } catch (e) {
      console.error('Error fetching system settings:', e);
      // Fallback defaults
      setSettings({ registrations_open: true, maintenance_mode: false });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SystemSettingsContext.Provider value={{ settings, isLoading, refreshSettings: fetchSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = () => useContext(SystemSettingsContext);
