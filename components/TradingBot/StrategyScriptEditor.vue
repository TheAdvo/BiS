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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Code, FileText, Save, Play } from 'lucide-vue-next'
import { ref } from 'vue'
import type { editor } from 'monaco-editor'

// Default strategy template
const defaultTemplate = `// ADVOAI Trading Strategy Template
// This strategy will be executed in real-time against OANDA market data`

const strategyCode = ref(defaultTemplate)
const isDeploying = ref(false)

// Monaco Editor options
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

// Editor change handler
function onEditorChange(value: string) {
  strategyCode.value = value
}

// Actions
const loadTemplate = () => {
  strategyCode.value = defaultTemplate
}

const saveStrategy = async () => {
  try {
    await $fetch('/api/trading-bot/strategies', {
      method: 'POST',
      body: {
        name: `Strategy_${Date.now()}`,
        code: strategyCode.value,
        language: 'javascript'
      }
    })
    console.log('Strategy saved successfully')
  } catch (error) {
    console.error('Failed to save strategy:', error)
  }
}

const deployStrategy = async () => {
  try {
    isDeploying.value = true
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
</script>
