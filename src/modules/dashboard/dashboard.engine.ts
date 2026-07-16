import { dashboardRepository, LiveDashboard } from "./dashboard.repository";

export const dashboardEngine = {
  async getLiveDashboard(): Promise<LiveDashboard> {
    return dashboardRepository.getLiveDashboard();
  },
};
