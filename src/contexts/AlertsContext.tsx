import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

interface AlertsContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const AlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.companyId || !user?.id) {
      setUnreadCount(0);
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      // Fetch vehicles with licensing due in 30 days
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, licensing_due_date')
        .eq('company_id', user.companyId);

      // Fetch drivers with CNH due in 30 days
      const { data: drivers } = await supabase
        .from('profiles')
        .select('id, cnh_due_date')
        .eq('company_id', user.companyId)
        .not('cnh_due_date', 'is', null);

      // Fetch read alerts for this user
      const { data: readAlerts } = await (supabase as any)
        .from('read_alerts')
        .select('alert_id')
        .eq('user_id', user.id);

      const readAlertIds = new Set(readAlerts?.map((r: any) => r.alert_id) || []);

      // Generate alert IDs and count unread ones
      let count = 0;

      // Count licensing alerts
      (vehicles || []).forEach((v: any) => {
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
      (drivers || []).forEach((d: any) => {
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
    }
  }, [user?.companyId, user?.id]);

  useEffect(() => {
    refreshUnreadCount();

    // Refresh every minute
    const interval = setInterval(refreshUnreadCount, 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  return (
    <AlertsContext.Provider value={{ unreadCount, refreshUnreadCount }}>
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
