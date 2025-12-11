import { DetectorResult, TrendDirection } from '../types/strategy';

export class ScoreAggregator {
  aggregate(results: DetectorResult[]): {
    finalScore: number;
    direction: TrendDirection;
    categoryScores: Record<string, number>;
  } {
    // Group by category
    const categories = this.groupByCategory(results);
    
    // Calculate category scores
    const categoryScores = this.calculateCategoryScores(categories);
    
    // Weighted average: Core(40%) + SMC(25%) + Patterns(20%) + Sentiment(10%) + ML(5%)
    const finalScore = 
      (categoryScores.CORE || 0) * 0.40 +
      (categoryScores.SMC || 0) * 0.25 +
      (categoryScores.PATTERNS || 0) * 0.20 +
      (categoryScores.SENTIMENT || 0) * 0.10 +
      (categoryScores.ML || 0) * 0.05;
    
    // Determine direction
    const direction = this.determineDirection(finalScore);
    
    return { finalScore, direction, categoryScores };
  }
  
  private groupByCategory(results: DetectorResult[]): Record<string, DetectorResult[]> {
    const grouped: Record<string, DetectorResult[]> = {
      CORE: [],
      SMC: [],
      PATTERNS: [],
      SENTIMENT: [],
      ML: []
    };
    
    for (const result of results) {
      grouped[result.category].push(result);
    }
    
    return grouped;
  }
  
  private calculateCategoryScores(
    categories: Record<string, DetectorResult[]>
  ): Record<string, number> {
    const categoryScores: Record<string, number> = {};
    
    for (const [category, detectors] of Object.entries(categories)) {
      if (detectors.length === 0) {
        categoryScores[category] = 0;
        continue;
      }
      
      // Weighted average: Σ(score × weight) / Σ(weight)
      let weightedSum = 0;
      let totalWeight = 0;
      
      for (const detector of detectors) {
        weightedSum += detector.score * detector.weight;
        totalWeight += Math.abs(detector.weight);
      }
      
      categoryScores[category] = totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
    
    return categoryScores;
  }
  
  private determineDirection(score: number): TrendDirection {
    if (score > 0.05) return 'BULLISH';
    if (score < -0.05) return 'BEARISH';
    return 'NEUTRAL';
  }
  
  // Additional utility methods
  getStrongestDetector(results: DetectorResult[]): DetectorResult | null {
    if (results.length === 0) return null;
    
    return results.reduce((strongest, current) => {
      const currentStrength = Math.abs(current.score * current.weight);
      const strongestStrength = Math.abs(strongest.score * strongest.weight);
      return currentStrength > strongestStrength ? current : strongest;
    });
  }
  
  getConsensus(results: DetectorResult[]): {
    bullish: number;
    bearish: number;
    neutral: number;
  } {
    let bullish = 0;
    let bearish = 0;
    let neutral = 0;
    
    for (const result of results) {
      if (result.score > 0.1) bullish++;
      else if (result.score < -0.1) bearish++;
      else neutral++;
    }
    
    return { bullish, bearish, neutral };
  }
}
