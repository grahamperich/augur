
export interface IFlash {
  pushSeconds(numberOfSeconds: number): Promise<Boolean>;
  pushDays(numberOfDays: number): Promise<Boolean>;
  pushWeeks(numberOfWeeks: number): Promise<Boolean>;
  setTimestamp(timestamp: number): Promise<Boolean>;
  setMarketEndTime(marketId: string): Promise<Boolean>;
  forceFinalize(marketId: string): Promise<Boolean>;
  tradeCompleteSets(marketId: string): Promise<Boolean>;
  designateReport(marketId: string, outcome: string): Promise<Boolean>;
  fillMarketOrders(marketId: string, outcome: string, orderType: string): Promise<Boolean>;
  nitialReport(marketId: string, outcome: string, invalid: boolean = false, noPush: boolean = false): Promise<Boolean>;
  dispose(): void;
}

export interface IMarket extends Object {
  id: string
  endTime: number
  reportingState: string
  description: string
}

export interface MarketCosts extends Object {
  targetReporterGasCosts: string
  reportingFeeDivisor: string
  designatedReportNoShowReputationBond: string
  validityBond: string
}
