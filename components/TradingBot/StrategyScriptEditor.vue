<template>
  <div class="w-full h-[600px]">
    <Card class="h-full">
      <CardHeader class="pb-3 border-b">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base font-bold flex items-center gap-2">
            <Code class="w-4 h-4" />
            <span>Strategy Script Editor</span>
            <Badge variant="outline" class="text-xs">
              <div class="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></div>
              JavaScript
            </Badge>
          </CardTitle>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" @click="loadTemplate">
              <FileText class="w-3 h-3 mr-1" />
              Template
            </Button>
            <Button variant="outline" size="sm" @click="saveStrategy" :disabled="!strategyCode.trim()">
              <Save class="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button size="sm" @click="deployStrategy" :disabled="!strategyCode.trim() || isDeploying">
              <Play class="w-3 h-3 mr-1" />
              {{ isDeploying ? 'Deploying...' : 'Deploy' }}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent class="p-0 h-[530px]">
        <!-- Monaco Editor Container -->
        <div ref="editorContainer" class="w-full h-full"></div>

        <!-- Fallback Textarea (if Monaco fails to load) -->
        <textarea v-if="!monacoLoaded" v-model="strategyCode" class="w-full h-full p-4 font-mono text-sm border-none outline-none resize-none" placeholder="Enter your trading strategy JavaScript code here..." />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Code, FileText, Save, Play } from 'lucide-vue-next'
import { ref, onMounted, onUnmounted } from 'vue'

// Editor state
const editorContainer = ref<HTMLElement>()
const strategyCode = ref('')
const monacoLoaded = ref(false)
const isDeploying = ref(false)
let monacoEditor: any = null

// Default strategy template
const defaultTemplate = `// ADVOAI Trading Strategy Template
// This strategy will be executed in real-time against OANDA market data

class TradingStrategy {
  constructor(api, instruments, config) {
    this.api = api;
    this.instruments = instruments;
    this.config = config;
    this.positions = new Map();

    // Strategy parameters
    this.riskPerTrade = config.riskPerTrade || 0.02; // 2% risk per trade
    this.maxPositions = config.maxPositions || 3;
    this.stopLoss = config.stopLoss || 0.01; // 1%
    this.takeProfit = config.takeProfit || 0.02; // 2%
  }

  // Main strategy logic - called on each price update
  async onTick(prices) {
    try {
      for (const [instrument, price] of Object.entries(prices)) {
        await this.checkEntry(instrument, price);
        await this.checkExit(instrument, price);
      }
    } catch (error) {
      console.error('Strategy error:', error);
    }
  }

  // Check for entry signals
  async checkEntry(instrument, price) {
    if (this.positions.size >= this.maxPositions) return;

    // Example: Simple moving average crossover
    const shortMA = await this.getMovingAverage(instrument, 10);
    const longMA = await this.getMovingAverage(instrument, 20);

    if (shortMA > longMA && !this.positions.has(instrument)) {
      await this.openPosition(instrument, 'LONG', price);
    } else if (shortMA < longMA && !this.positions.has(instrument)) {
      await this.openPosition(instrument, 'SHORT', price);
    }
  }

  // Check for exit signals
  async checkExit(instrument, price) {
    const position = this.positions.get(instrument);
    if (!position) return;

    const pnlPercent = this.calculatePnL(position, price);

    // Stop loss / Take profit
    if (pnlPercent <= -this.stopLoss || pnlPercent >= this.takeProfit) {
      await this.closePosition(instrument);
    }
  }

  // Helper methods
  async getMovingAverage(instrument, periods) {
    // Implementation would fetch historical data and calculate MA
    return 1.1750; // Placeholder
  }

  calculatePnL(position, currentPrice) {
    const direction = position.side === 'LONG' ? 1 : -1;
    return direction * (currentPrice - position.entryPrice) / position.entryPrice;
  }

  async openPosition(instrument, side, price) {
    try {
      const units = this.calculatePositionSize(price);
      const position = {
        instrument,
        side,
        entryPrice: price,
        units,
        timestamp: Date.now()
      };

      // Execute trade via OANDA API
      await this.api.createOrder({
        instrument,
        units: side === 'LONG' ? units : -units,
        type: 'MARKET'
      });

      this.positions.set(instrument, position);
      console.log(\`Opened \${side} position on \${instrument} at \${price}\`);
    } catch (error) {
      console.error('Failed to open position:', error);
    }
  }

  async closePosition(instrument) {
    try {
      const position = this.positions.get(instrument);
      if (!position) return;

      await this.api.closePosition(instrument);
      this.positions.delete(instrument);
      console.log(\`Closed position on \${instrument}\`);
    } catch (error) {
      console.error('Failed to close position:', error);
    }
  }

  calculatePositionSize(price) {
    // Calculate position size based on risk management
    const accountBalance = this.api.getAccountBalance();
    const riskAmount = accountBalance * this.riskPerTrade;
    return Math.floor(riskAmount / (price * this.stopLoss));
  }
}

// Export the strategy
module.exports = TradingStrategy;`

// Load Monaco Editor
const loadMonacoEditor = async () => {
  try {
    // Dynamically import Monaco Editor
    const monaco = await import('monaco-editor')

    if (editorContainer.value) {
      monacoEditor = monaco.editor.create(editorContainer.value, {
        value: strategyCode.value || defaultTemplate,
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 13,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible'
        },
        wordWrap: 'on'
      })

      // Update reactive variable when editor content changes
      monacoEditor.onDidChangeModelContent(() => {
        strategyCode.value = monacoEditor.getValue()
      })

      monacoLoaded.value = true
    }
  } catch (error) {
    console.warn('Monaco Editor failed to load, falling back to textarea:', error)
    strategyCode.value = defaultTemplate
  }
}

// Actions
const loadTemplate = () => {
  const newCode = defaultTemplate
  if (monacoEditor) {
    monacoEditor.setValue(newCode)
  } else {
    strategyCode.value = newCode
  }
}

const saveStrategy = async () => {
  try {
    // Save strategy to backend
    await $fetch('/api/trading-bot/strategies', {
      method: 'POST',
      body: {
        name: `Strategy_${Date.now()}`,
        code: strategyCode.value,
        language: 'javascript'
      }
    })

    // Show success notification
    console.log('Strategy saved successfully')
  } catch (error) {
    console.error('Failed to save strategy:', error)
  }
}

const deployStrategy = async () => {
  try {
    isDeploying.value = true

    // Deploy strategy to trading engine
    await $fetch('/api/trading-bot/deploy', {
      method: 'POST',
      body: {
        code: strategyCode.value,
        config: {
          instruments: ['EUR_USD', 'GBP_USD'],
          riskPerTrade: 0.01,
          maxPositions: 2
        }
      }
    })

    console.log('Strategy deployed successfully')
  } catch (error) {
    console.error('Failed to deploy strategy:', error)
  } finally {
    isDeploying.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadMonacoEditor()
})

onUnmounted(() => {
  if (monacoEditor) {
    monacoEditor.dispose()
  }
})
</script>
