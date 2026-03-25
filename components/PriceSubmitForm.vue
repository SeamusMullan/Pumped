<template>
  <form
    class="mt-3 border-t border-gray-100 pt-3"
    @submit.prevent="handleSubmit"
  >
    <p class="text-xs font-medium text-gray-700 mb-2">Report a fuel price</p>

    <div class="flex flex-wrap gap-2">
      <select
        v-model="fuelType"
        class="text-xs rounded-md border border-gray-300 px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
        required
      >
        <option value="" disabled>Fuel type</option>
        <option value="unleaded">Unleaded</option>
        <option value="diesel">Diesel</option>
        <option value="premium">Premium</option>
        <option value="e10">E10</option>
        <option value="lpg">LPG</option>
      </select>

      <div class="relative">
        <span class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
        <input
          v-model.number="price"
          type="number"
          step="0.001"
          min="0.500"
          max="3.500"
          placeholder="1.789"
          class="text-xs rounded-md border border-gray-300 pl-5 pr-2 py-1.5 w-24 focus:outline-none focus:ring-1 focus:ring-green-500"
          required
        />
      </div>

      <button
        type="submit"
        :disabled="submitting"
        class="text-xs rounded-md bg-green-600 text-white px-3 py-1.5 font-medium hover:bg-green-700 disabled:opacity-50 transition"
      >
        {{ submitting ? 'Sending...' : 'Submit' }}
      </button>
    </div>

    <p v-if="successMsg" class="mt-1.5 text-xs text-green-600">{{ successMsg }}</p>
    <p v-if="errorMsg" class="mt-1.5 text-xs text-red-600">{{ errorMsg }}</p>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{
  stationId: string
}>()

const emit = defineEmits<{
  submitted: []
}>()

const fuelType = ref('')
const price = ref<number | null>(null)
const submitting = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

async function handleSubmit() {
  if (!fuelType.value || !price.value) return

  submitting.value = true
  successMsg.value = ''
  errorMsg.value = ''

  try {
    await $fetch(`/api/stations/${encodeURIComponent(props.stationId)}/prices`, {
      method: 'POST',
      body: { fuelType: fuelType.value, price: price.value },
    })
    successMsg.value = 'Price submitted! Thank you.'
    price.value = null
    emit('submitted')

    setTimeout(() => { successMsg.value = '' }, 3000)
  }
  catch (e: any) {
    errorMsg.value = e?.data?.statusMessage || 'Failed to submit price. Try again.'
  }
  finally {
    submitting.value = false
  }
}
</script>
