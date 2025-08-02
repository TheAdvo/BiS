<template>
  <div class="w-full h-[600px]">
    <Card class="h-full flex flex-col">
      <CardHeader class="">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base font-bold flex items-center gap-2">
            <Code class="w-4 h-4" />
            <span>Strategy Script Editor</span>
            <Badge variant="outline" class="text-xs">
              <div class="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1"></div>
              TypeScript
            </Badge>
          </CardTitle>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" @click="loadTemplate" aria-label="Load template">
              <FileText class="w-3 h-3 mr-1" />
              Template
            </Button>
            <Button variant="outline" size="sm" @click="saveStrategy" :disabled="!strategyCode.trim()" aria-label="Save strategy">
              <Save class="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button size="sm" @click="deployStrategy" :disabled="!strategyCode.trim() || isDeploying" aria-label="Deploy strategy">
              <Play class="w-3 h-3 mr-1" />
              <span v-if="isDeploying">
                <span class="animate-spin mr-1">⏳</span>
                Deploying...
              </span>
              <span v-else>Deploy</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent class="p-0 flex-1">
        <div class="h-full w-full">
          <ClientOnly>
            <MonacoEditor v-model="strategyCode" lang="typescript" :options="editorOptions" @change="onEditorChange" style="height: 100%;" />
          </ClientOnly>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
// ---[ UI Components and Icons ]---
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Code, FileText, Save, Play } from 'lucide-vue-next'
import { ref, computed } from 'vue'
import { useStrategyStore } from '@/stores/strategy'
import type { editor } from 'monaco-editor'

// ---[ Default strategy template function ]---
function getDefaultStrategyTemplate(): string {
  return `// ADVOAI Trading Strategy Template
// This strategy will be executed in real-time against OANDA market data

function onTick(marketData) {
  // Example: Simple moving average crossover
  // Replace with your strategy logic

  // const fastMA = calculateMA(marketData, 10)
  // const slowMA = calculateMA(marketData, 50)
  // if (fastMA > slowMA) {
  //   return { action: 'BUY' }
  // } else if (fastMA < slowMA) {
  //   return { action: 'SELL' }
  // }
  // return { action: 'HOLD' }
}
`;
}

// ---[ Pinia Store: Centralized strategy management ]---
const strategyStore = useStrategyStore()

// ---[ State: Strategy code (from store) and deployment status (from store) ]---
const strategyCode = computed({
  get: () => strategyStore.currentStrategyCode || getDefaultStrategyTemplate(),
  set: (val: string) => strategyStore.setCurrentStrategyCode(val)
})
const isDeploying = computed(() => strategyStore.isDeploying)
const error = computed(() => strategyStore.error)

// ---[ Monaco Editor options ]---
const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  language: 'JavaScript',
  lineNumbers: 'on', // Allowed: 'on', 'off', 'relative', 'interval'
  minimap: { enabled: false },
  fontSize: 14,
  roundedSelection: true,
  scrollbar: { vertical: 'auto', horizontal: 'visible' }, // Allowed: 'visible', 'auto', 'hidden'
  wordWrap: 'on',
  automaticLayout: true,
  scrollBeyondLastLine: true,
  theme: 'vs-dark',
}

// ---[ Editor change handler ]---
function onEditorChange(value: string) {
  strategyCode.value = value
}

// ---[ Actions: Load template, save, deploy (via store) ]---
const loadTemplate = () => {
  strategyStore.setCurrentStrategyCode(getDefaultStrategyTemplate())
}

const saveStrategy = async () => {
  await strategyStore.saveStrategy({
    name: `Strategy_${Date.now()}`,
    code: strategyCode.value,
    language: 'Typescript'
  })
}

const deployStrategy = async () => {
  await strategyStore.deployStrategy({
    code: strategyCode.value,
    config: {
      instruments: ['EUR_USD', 'GBP_USD'],
      riskPerTrade: 0.01,
      maxPositions: 2
    }
  })
}

// ---[ TODO: Integrate Pinia store for strategies and deployment status if needed ]---
</script>
