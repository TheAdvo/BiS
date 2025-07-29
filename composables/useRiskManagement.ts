// composables/useRiskManagement.ts
interface RiskCalculation {
  positionSize: number
  stopLoss: number
  takeProfit: number
  riskRewardRatio: number
  maxRisk: number
  potentialProfit: number
  potentialLoss: number
  marginRequired: number
  leverage: number
}

interface RiskSettings {
  accountBalance: number
  riskPercentage: number
  entryPrice: number
  stopLossPrice: number
  takeProfitPrice: number
  leverage: number
  direction: 'long' | 'short'
}

export const useRiskManagement = () => {
  const riskSettings = ref<RiskSettings>({
    accountBalance: 10000,
    riskPercentage: 2,
    entryPrice: 0,
    stopLossPrice: 0,
    takeProfitPrice: 0,
    leverage: 30,
    direction: 'long'
  })

  const calculation = ref<RiskCalculation>({
    positionSize: 0,
    stopLoss: 0,
    takeProfit: 0,
    riskRewardRatio: 0,
    maxRisk: 0,
    potentialProfit: 0,
    potentialLoss: 0,
    marginRequired: 0,
    leverage: 30
  })

  // Calculate position size based on risk
  const calculatePositionSize = () => {
    const { accountBalance, riskPercentage, entryPrice, stopLossPrice, direction } = riskSettings.value

    if (!entryPrice || !stopLossPrice) return 0

    const riskAmount = (accountBalance * riskPercentage) / 100

    let stopLossDistance: number
    if (direction === 'long') {
      stopLossDistance = entryPrice - stopLossPrice
    } else {
      stopLossDistance = stopLossPrice - entryPrice
    }

    if (stopLossDistance <= 0) return 0

    // For forex, typical pip value calculation
    const pipValue = 0.0001 // For EUR/USD
    const pipsAtRisk = stopLossDistance / pipValue

    // Position size = Risk Amount / (Pips at Risk × Pip Value × Units per Lot)
    const positionSize = riskAmount / (pipsAtRisk * pipValue * 100000)

    return Math.round(positionSize * 100000) / 100000 // Round to 5 decimal places
  }

  // Calculate risk-reward ratio
  const calculateRiskReward = () => {
    const { entryPrice, stopLossPrice, takeProfitPrice, direction } = riskSettings.value

    if (!entryPrice || !stopLossPrice || !takeProfitPrice) return 0

    let risk: number, reward: number

    if (direction === 'long') {
      risk = entryPrice - stopLossPrice
      reward = takeProfitPrice - entryPrice
    } else {
      risk = stopLossPrice - entryPrice
      reward = entryPrice - takeProfitPrice
    }

    if (risk <= 0) return 0

    return Math.round((reward / risk) * 100) / 100
  }

  // Calculate margin required
  const calculateMarginRequired = () => {
    const { entryPrice, leverage } = riskSettings.value
    const positionSize = calculation.value.positionSize

    if (!entryPrice || !positionSize) return 0

    return (positionSize * entryPrice) / leverage
  }

  // Update all calculations
  const updateCalculations = () => {
    const positionSize = calculatePositionSize()
    const riskRewardRatio = calculateRiskReward()
    const marginRequired = calculateMarginRequired()

    const { accountBalance, riskPercentage, entryPrice, stopLossPrice, takeProfitPrice, direction } = riskSettings.value

    let potentialLoss = 0
    let potentialProfit = 0

    if (positionSize && entryPrice && stopLossPrice && takeProfitPrice) {
      if (direction === 'long') {
        potentialLoss = positionSize * (entryPrice - stopLossPrice)
        potentialProfit = positionSize * (takeProfitPrice - entryPrice)
      } else {
        potentialLoss = positionSize * (stopLossPrice - entryPrice)
        potentialProfit = positionSize * (entryPrice - takeProfitPrice)
      }
    }

    calculation.value = {
      positionSize,
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      riskRewardRatio,
      maxRisk: (accountBalance * riskPercentage) / 100,
      potentialProfit: Math.abs(potentialProfit),
      potentialLoss: Math.abs(potentialLoss),
      marginRequired,
      leverage: riskSettings.value.leverage
    }
  }

  // Risk assessment
  const riskAssessment = computed(() => {
    const { riskRewardRatio, marginRequired } = calculation.value
    const { accountBalance } = riskSettings.value

    const marginPercent = (marginRequired / accountBalance) * 100

    let assessment = 'Unknown'
    let color = 'gray'

    if (riskRewardRatio >= 3 && marginPercent <= 10) {
      assessment = 'Excellent'
      color = 'green'
    } else if (riskRewardRatio >= 2 && marginPercent <= 20) {
      assessment = 'Good'
      color = 'blue'
    } else if (riskRewardRatio >= 1.5 && marginPercent <= 30) {
      assessment = 'Acceptable'
      color = 'yellow'
    } else if (riskRewardRatio >= 1 && marginPercent <= 50) {
      assessment = 'Poor'
      color = 'orange'
    } else {
      assessment = 'High Risk'
      color = 'red'
    }

    return { assessment, color, marginPercent }
  })

  // Position size recommendations
  const positionSizeRecommendations = computed(() => {
    const conservative = calculatePositionSize() * 0.5
    const moderate = calculatePositionSize()
    const aggressive = calculatePositionSize() * 1.5

    return {
      conservative: Math.round(conservative * 100000) / 100000,
      moderate: Math.round(moderate * 100000) / 100000,
      aggressive: Math.round(aggressive * 100000) / 100000
    }
  })

  // Watch for changes and update calculations
  watch(riskSettings, updateCalculations, { deep: true })

  // Validate trade setup
  const validateTrade = () => {
    const errors: string[] = []
    const warnings: string[] = []

    const { entryPrice, stopLossPrice, takeProfitPrice, direction } = riskSettings.value
    const { riskRewardRatio, marginRequired } = calculation.value

    if (!entryPrice) errors.push('Entry price is required')
    if (!stopLossPrice) errors.push('Stop loss price is required')
    if (!takeProfitPrice) warnings.push('Take profit price not set')

    if (direction === 'long') {
      if (stopLossPrice >= entryPrice) errors.push('Stop loss must be below entry price for long positions')
      if (takeProfitPrice <= entryPrice) warnings.push('Take profit should be above entry price for long positions')
    } else {
      if (stopLossPrice <= entryPrice) errors.push('Stop loss must be above entry price for short positions')
      if (takeProfitPrice >= entryPrice) warnings.push('Take profit should be below entry price for short positions')
    }

    if (riskRewardRatio < 1.5) warnings.push('Risk/reward ratio below 1.5 is not recommended')
    if (marginRequired > riskSettings.value.accountBalance * 0.5) warnings.push('High margin usage detected')

    return { errors, warnings, isValid: errors.length === 0 }
  }

  return {
    riskSettings,
    calculation: readonly(calculation),
    riskAssessment,
    positionSizeRecommendations,
    updateCalculations,
    validateTrade
  }
}
