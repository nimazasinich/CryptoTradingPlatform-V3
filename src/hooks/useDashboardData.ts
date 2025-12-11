
import { useMarketData } from './useMarketData';

// Re-export the new hook as the old name to maintain compatibility
// while switching to the robust service-layer implementation.
export const useDashboardData = useMarketData;
