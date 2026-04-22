// CoinManager - Ensures coin counting works properly between Game and ScorePanel

export class CoinManager {
  private coinCount: number = 0;
  private scorePanel: any = null;

  constructor(scorePanel: any) {
    this.scorePanel = scorePanel;
    this.coinCount = 0;
  }

  public addCoins(amount: number = 1): void {
    this.coinCount += amount;
    
    console.log('[v0] CoinManager.addCoins called', {
      amount,
      totalCoins: this.coinCount,
      hasScorepanel: !!this.scorePanel,
      scorePanelType: this.scorePanel?.constructor?.name
    });

    if (this.scorePanel) {
      if (typeof this.scorePanel.addCoins === 'function') {
        this.scorePanel.addCoins(amount);
        console.log('[v0] Called scorePanel.addCoins successfully');
      } else {
        console.error('[v0] scorePanel.addCoins is not a function!', this.scorePanel);
      }
    }
  }

  public resetCoins(): void {
    this.coinCount = 0;
    if (this.scorePanel && typeof this.scorePanel.resetCoins === 'function') {
      this.scorePanel.resetCoins();
    }
    console.log('[v0] CoinManager reset');
  }

  public getCoinCount(): number {
    return this.coinCount;
  }
}
