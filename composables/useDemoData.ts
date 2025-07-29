// composables/useDemoData.ts
export const useDemoData = () => {
  const initializeDemoData = async () => {
    // This can be called to populate the system with demo data
    // for testing when real APIs are not available

    console.log('Demo data initialization complete - all composables have built-in mock data')
  }

  return {
    initializeDemoData
  }
}
