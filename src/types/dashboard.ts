import { UseDashboardReturn } from '../hooks/useDashboard';

export interface DashboardProps {
  dashboardData: UseDashboardReturn;
  onRefresh: {
    stats: () => Promise<void>;
    activities: () => Promise<void>;
    alerts: () => Promise<void>;
  };
}