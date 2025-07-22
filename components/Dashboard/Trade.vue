<template>
  <Card class="w-full text-muted-foreground">
    <CardHeader>
      <CardTitle>
        <div class="text-2xl font-bold text-primary">Place a Trade</div>
      </CardTitle>
      <CardDescription>Submit a trade order to your OANDA account.</CardDescription>
    </CardHeader>
    <CardContent>
      <form @submit.prevent="placeTrade">
        <div class="grid gap-4">
          <div class="grid gap-2">
            <Label for="instrument">Instrument</Label>
            <Select v-model="instrument">
              <SelectTrigger>
                <SelectValue placeholder="Select an instrument" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="EUR_USD">EUR/USD</SelectItem>
                  <SelectItem value="USD_JPY">USD/JPY</SelectItem>
                  <SelectItem value="GBP_USD">GBP/USD</SelectItem>
                  <SelectItem value="AUD_USD">AUD/USD</SelectItem>
                  <SelectItem value="USD_CAD">USD/CAD</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label for="units">Units</Label>
            <Input id="units" v-model="units" type="number" placeholder="Enter number of units" />
          </div>
          <div class="grid gap-2">
            <Label>Side</Label>
            <div class="flex items-center space-x-4">
              <div class="flex items-center">
                <input id="buy" v-model="side" type="radio" value="BUY" class="h-4 w-4">
                <Label for="buy" class="ml-2">Buy</Label>
              </div>
              <div class="flex items-center">
                <input id="sell" v-model="side" type="radio" value="SELL" class="h-4 w-4">
                <Label for="sell" class="ml-2">Sell</Label>
              </div>
            </div>
          </div>
          <Button type="submit" class="w-full">Place Trade</Button>
        </div>
      </form>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const instrument = ref('EUR_USD')
const units = ref(1000)
const side = ref('BUY')

async function placeTrade() {
  try {
    const response = await fetch('/api/oanda/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order: {
          instrument: instrument.value,
          units: (side.value === 'BUY' ? 1 : -1) * units.value,
          type: 'MARKET',
          timeInForce: 'FOK',
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.errorMessage || 'Failed to place trade')
    }

    const result = await response.json()
    console.log('Trade placed successfully:', result)
    // You can add a success message to the UI here
  } catch (error) {
    console.error('Error placing trade:', error)
    // You can add an error message to the UI here
  }
}
</script>
