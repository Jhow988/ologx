import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

interface AlertsContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  isLoading: boolean;
}

interface ReadAlert {
  alert_id: string;
}

interface Vehicle {
  id: string;
  licensing_due_date: string;
}

interface Driver {
  id: string;
  cnh_due_date: string;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const AlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const isFetchingRef = useRef(false);

  const refreshUnreadCount = useCallback(async () => {
    // Prevenir chamadas duplicadas simultâneas
    if (isFetchingRef.current) {
      return;
    }

    // Super admin não deve ver alertas de empresas
    if (user?.isSuperAdmin) {
      setUnreadCount(0);
      return;
    }

    // Verificar se usuário tem empresa e ID válidos
    if (!user?.companyId || !user?.id) {
      setUnreadCount(0);
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      // Fetch vehicles with licensing due in 30 days (only active)
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, licensing_due_date')
        .eq('company_id', user.companyId)
        .eq('status', 'active');

      if (vehiclesError) {
        console.error('Error fetching vehicles:', vehiclesError);
        throw vehiclesError;
      }

      // Fetch drivers with CNH due in 30 days (only active)
      const { data: drivers, error: driversError } = await supabase
        .from('profiles')
        .select('id, cnh_due_date')
        .eq('company_id', user.companyId)
        .eq('status', 'active')
        .not('cnh_due_date', 'is', null);

      if (driversError) {
        console.error('Error fetching drivers:', driversError);
        throw driversError;
      }

      // Fetch read alerts for this user
      const { data: readAlerts, error: readAlertsError } = await supabase
        .from('read_alerts')
        .select('alert_id')
        .eq('user_id', user.id);

      if (readAlertsError) {
        console.error('Error fetching read alerts:', readAlertsError);
        throw readAlertsError;
      }

      const readAlertIds = new Set(
        (readAlerts as ReadAlert[] | null)?.map((r) => r.alert_id) || []
      );

      // Generate alert IDs and count unread ones
      let count = 0;

      // Count licensing alerts
      (vehicles as Vehicle[] | null || []).forEach((v) => {
        if (v.licensing_due_date) {
          const dueDate = new Date(v.licensing_due_date + 'T00:00:00');
          if (dueDate <= thirtyDaysFromNow) {
            const alertId = `licensing-${v.id}`;
            if (!readAlertIds.has(alertId)) {
              count++;
            }
          }
        }
      });

      // Count CNH alerts
      (drivers as Driver[] | null || []).forEach((d) => {
        if (d.cnh_due_date) {
          const dueDate = new Date(d.cnh_due_date + 'T00:00:00');
          if (dueDate <= thirtyDaysFromNow) {
            const alertId = `cnh-${d.id}`;
            if (!readAlertIds.has(alertId)) {
              count++;
            }
          }
        }
      });

      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread alerts count:', error);
      // Em caso de erro, manter o contador anterior (não resetar para 0)
      // Isso evita flicker na UI
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.companyId, user?.id, user?.isSuperAdmin]);

  useEffect(() => {
    refreshUnreadCount();

    // Refresh every minute
    const interval = setInterval(refreshUnreadCount, 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  return (
    <AlertsContext.Provider value={{ unreadCount, refreshUnreadCount, isLoading }}>
      {children}
    </AlertsContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
};
