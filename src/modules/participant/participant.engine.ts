import { participantRepository, RawTeam, TeamConsoleRaw } from "./participant.repository";
import { EventStatus } from "@prisma/client";

export interface DashboardEvent {
  status: EventStatus;
  activePackageId: string | null;
}

export interface DashboardStatistics {
  remainingCash: number;
  packagesWon: number;
  packagesAuctioned: number;
  captureRate: number;
  totalInvestment: number;
  highestWinningBid: number;
}

export interface DashboardResult {
  event: DashboardEvent;
  statistics: DashboardStatistics;
}

export interface SectorShares {
  sector: string;
  shares: number;
}

export interface CompanyHolding {
  company: string;
  shares: number;
}

export interface TransactionEntry {
  package: {
    id: string;
    name: string;
  };
  winningBid: number;
  createdAt: Date;
}

export interface Portfolio {
  cashBalance: number;
  packagesWon: number;
  companiesOwned: number;
  totalShares: number;
  totalInvestment: number;
  investmentUtilized: number;
  cashRemaining: number;
  holdingsBySector: SectorShares[];
  companyHoldings: CompanyHolding[];
}

export interface Statistics {
  packagesAuctioned: number;
  packagesWon: number;
  captureRate: number;
  highestWinningBid: number;
  averageWinningBid: number;
  companiesOwned: number;
  totalShares: number;
  investmentUtilized: number;
  cashRemaining: number;
  portfolioAllocation: SectorShares[];
}

export interface TeamConsoleResult {
  portfolio: Portfolio;
  transactions: TransactionEntry[];
  statistics: Statistics;
}

/**
 * Aggregates company shares by sector across all owned packages.
 * The result is used for both holdingsBySector and portfolioAllocation.
 */
function aggregateBySector(team: RawTeam): SectorShares[] {
  const sectorMap = new Map<string, number>();

  for (const pkg of team.ownedPackages) {
    for (const pc of pkg.packageCompanies) {
      sectorMap.set(
        pc.company.sector,
        (sectorMap.get(pc.company.sector) ?? 0) + pc.shares
      );
    }
  }

  return Array.from(sectorMap.entries()).map(([sector, shares]) => ({
    sector,
    shares,
  }));
}

/**
 * Aggregates total shares per company across all owned packages.
 */
function aggregateByCompany(team: RawTeam): CompanyHolding[] {
  const companyMap = new Map<
    string,
    {
      name: string;
      shares: number;
    }
  >();

  for (const pkg of team.ownedPackages) {
    for (const pc of pkg.packageCompanies) {
      const existing = companyMap.get(pc.company.id);

      if (existing) {
        existing.shares += pc.shares;
      } else {
        companyMap.set(pc.company.id, {
          name: pc.company.name,
          shares: pc.shares,
        });
      }
    }
  }

  return Array.from(companyMap.values()).map((company) => ({
    company: company.name,
    shares: company.shares,
  }));
}

export const participantEngine = {
  async getTeamConsole(teamId: string): Promise<TeamConsoleResult> {
    const raw: TeamConsoleRaw =
      await participantRepository.getTeamConsole(teamId);
    const { team, packagesAuctioned } = raw;

    // Sector aggregation — shared between holdingsBySector and portfolioAllocation
    const holdingsBySector = aggregateBySector(team);
    const companyHoldings = aggregateByCompany(team);

    const packagesWon = team.ownedPackages.length;
    const companiesOwned = companyHoldings.length;
    const totalShares = companyHoldings.reduce((sum, ch) => sum + ch.shares, 0);
    const cashBalance = team.remainingCash;

    const totalInvestment = team.transactions.reduce(
      (sum, tx) => sum + tx.winningBid,
      0
    );

    /*
     * investmentUtilized is expressed as a percentage of the team's starting cash.
     * The schema stores only remainingCash (a mutable balance). There is no persisted
     * field or project constant for the starting value. The only derivation available
     * from the schema is:
     *
     *   startingCash = remainingCash + totalInvestment
     *
     * This holds exactly because remainingCash is decremented by each winningBid
     * (see transaction.repository.ts). investmentUtilized is therefore:
     *
     *   (totalInvestment / startingCash) * 100
     *
     * When the team has made no purchases, startingCash = remainingCash and
     * investmentUtilized = 0.
     */
    const startingCash = cashBalance + totalInvestment;
    const investmentUtilized =
      startingCash > 0
        ? Math.round((totalInvestment / startingCash) * 100)
        : 0;

    const cashRemaining = cashBalance;

    // Transactions are already ordered newest → oldest by the repository
    const transactions: TransactionEntry[] = team.transactions.map((tx) => ({
      package: tx.package,
      winningBid: tx.winningBid,
      createdAt: tx.createdAt,
    }));

    const bids = team.transactions.map((tx) => tx.winningBid);
    const highestWinningBid = bids.length > 0 ? Math.max(...bids) : 0;
    const averageWinningBid =
      bids.length > 0
        ? Math.round(bids.reduce((sum, b) => sum + b, 0) / bids.length)
        : 0;

    const captureRate =
      packagesAuctioned === 0
        ? 0
        : Math.round((packagesWon / packagesAuctioned) * 100);

    return {
      portfolio: {
        cashBalance,
        packagesWon,
        companiesOwned,
        totalShares,
        totalInvestment,
        investmentUtilized,
        cashRemaining,
        holdingsBySector,
        companyHoldings,
      },
      transactions,
      statistics: {
        packagesAuctioned,
        packagesWon,
        captureRate,
        highestWinningBid,
        averageWinningBid,
        companiesOwned,
        totalShares,
        investmentUtilized,
        cashRemaining,
        portfolioAllocation: holdingsBySector,
      },
    };
  },

  async getDashboard(teamId: string): Promise<DashboardResult> {
    const raw = await participantRepository.getDashboard(teamId);
    
    const { event, team, packagesAuctioned } = raw;
    
    const remainingCash = team.remainingCash;
    const packagesWon = team.ownedPackages.length;
    
    const bids = team.transactions.map((tx) => tx.winningBid);
    const totalInvestment = bids.reduce((sum, bid) => sum + bid, 0);
    const highestWinningBid = bids.length > 0 ? Math.max(...bids) : 0;
    
    const captureRate = packagesAuctioned === 0 
      ? 0 
      : Math.round((packagesWon / packagesAuctioned) * 100);

    return {
      event: {
        status: event.status,
        activePackageId: event.activePackageId,
      },
      statistics: {
        remainingCash,
        packagesWon,
        packagesAuctioned,
        captureRate,
        totalInvestment,
        highestWinningBid,
      },
    };
  },
};
