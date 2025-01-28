<script setup>
import { nextTick, reactive, ref, shallowRef } from 'vue'
import store from '../../store'
import Button from '../Button/Button.vue'
import Select from '../Select/Select.vue'
import Input from '../Input/Input.vue'

defineOptions({
  name: 'Datepicker'
})

defineExpose({
  on: make,
  off: destroy
})

const data = reactive({
  days: []
})

let instance = null

const datepicker = shallowRef()

const showDatepicker = ref()

const style = ref(null)

const yearOffset = 10

const dateFormat = store.getters.get('config.datetimeFormat', 'dd-mm-YYYY')

const timeFormat = 'H:i:s'

const monthNames = store.getters.get('lang.monthNames', [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
])

const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const dayNames = store.getters.get('lang.dayNames', [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
])

const startDay = parseInt(store.getters.get('lang.startDay', 1))

const dayChars = 1

const patterns = {
  'dd-mm-YYYY': '^(?<day>0[1-9]|[12][0-9]|3[01])-(?<month>0[1-9]|1[0-2])-(?<year>\\d{4})$',
  'mm-dd-YYYY': '^(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12][0-9]|3[01])-(?<year>\\d{4})$',
  'YYYY-dd-mm': '^(?<year>\\d{4})-(?<day>0[1-9]|[12][0-9]|3[01])-(?<month>0[1-9]|1[0-2])$',
  'YYYY-mm-dd': '^(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12][0-9]|3[01])$',
  'dd.mm.YYYY': '^(?<day>0[1-9]|[12][0-9]|3[01])\.(?<month>0[1-9]|1[0-2])\.(?<year>\\d{4})$',
  'mm.dd.YYYY': '^(?<month>0[1-9]|1[0-2])\.(?<day>0[1-9]|[12][0-9]|3[01])\.(?<year>\\d{4})$',
  'YYYY.dd.mm': '^(?<year>\\d{4})\.(?<day>0[1-9]|[12][0-9]|3[01])\.(?<month>0[1-9]|1[0-2])$',
  'YYYY.mm.dd': '^(?<year>\\d{4})\.(?<month>0[1-9]|1[0-2])\.(?<day>0[1-9]|[12][0-9]|3[01])$',
  'dd/mm/YYYY': '^(?<day>0[1-9]|[12][0-9]|3[01])\\/(?<month>0[1-9]|1[0-2])\\/(?<year>\\d{4})$',
  'mm/dd/YYYY': '^(?<month>0[1-9]|1[0-2])\\/(?<day>0[1-9]|[12][0-9]|3[01])\\/(?<year>\\d{4})$',
  'YYYY/dd/mm': '^(?<year>\\d{4})\\/(?<day>0[1-9]|[12][0-9]|3[01])\\/(?<month>0[1-9]|1[0-2])$',
  'YYYY/mm/dd': '^(?<year>\\d{4})\\/(?<month>0[1-9]|1[0-2])\\/(?<day>0[1-9]|[12][0-9]|3[01])$'
}

let currentDate = new Date()
let yearStart = new Date().getFullYear()

let days = ref(null)

function make (self) {
  instance = self

  const d = getModel() ? (getModel() || '').toString().split(' ') : []
  currentDate = new Date()

  let date
  let time

  if (/:/.test(d[0])) {
    date = d[1] ?? ''
    time = d[0] ?? ''
  } else {
    date = d[0] ?? ''
    time = d[1] ?? ''
  }

  for (const p in patterns) {
    const reg = new RegExp(patterns[p])

    if (reg.test(date)) {
      const groups = date.match(reg).groups
      currentDate.setFullYear(parseInt(groups['year']), parseInt(groups['month']) - 1, parseInt(groups['day']))

      if (time) {
        const t = time.split(':')
        currentDate.setHours(parseInt(t[0] ?? 0), parseInt(t[1] ?? 0), parseInt(t[2] ?? 0))
      }

      break
    }
  }

  yearStart = currentDate.getFullYear()
  showDatepicker.value = true

  nextTick(() => {
    const position = instance.refs.input.getBoundingClientRect()
    let top, left = position.left

    if (position.top + position.height + datepicker.value.offsetHeight + 16 > window.innerHeight) {
      top = position.top - datepicker.value.offsetHeight
    } else {
      top = position.top + position.height
    }

    if (position.left + datepicker.value.offsetWidth + 16 > window.innerWidth) {
      left = window.innerWidth - datepicker.value.offsetWidth - 16
    }

    style.value = {
      left: `${left}px`,
      top: `${top}px`
    }
  })

  setDays()
}

function destroy () {
  showDatepicker.value = false
}

function clear (ctx) {
  ctx.model = ''
}

function setDays () {
  const date = new Date(currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1) + '-01')
  let day = 1 - (7 + date.getDay() - startDay) % 7, week = 0
  daysInMonth[1] = date.getFullYear() % 4 === 0 ? 29 : 28

  days.value = []

  while (day <= daysInMonth[date.getMonth()]) {
    days.value[week] = []

    for (let i = 0; i <= 6; i++) {
      days.value[week][i] = {
        active: false,
        value: null,
        current: null
      }

      if (day <= daysInMonth[date.getMonth()] && day > 0) {
        days.value[week][i].value = day
        days.value[week][i].active = true
      } else {
        days.value[week][i].value = day > 0
            ? day - daysInMonth[date.getMonth()]
            : (daysInMonth[date.getMonth() - 1] || daysInMonth[11]) + day
      }

      if (
          days.value[week][i].value === currentDate.getDate() &&
          date.getMonth() === currentDate.getMonth() &&
          date.getFullYear() === currentDate.getFullYear()
      ) {
        days.value[week][i].selected = true
      }

      if (
          day === (new Date).getDate() &&
          date.getMonth() === (new Date).getMonth() &&
          date.getFullYear() === (new Date).getFullYear()
      ) {
        days.value[week][i].current = true
      }

      day++

      if (i === 6) {
        week++
      }
    }
  }

  setModel(getDate() + ' ' + getTime())
}

function getDate () {
  return dateFormat.replace(
      /dd|mm|YYYY/g,
      a => ({
        dd: currentDate.getDate().toString().padStart(2, '0'),
        mm: (currentDate.getMonth() + 1).toString().padStart(2, '0'),
        YYYY: currentDate.getFullYear()
      }[a])
  )
}

function getTime () {
  return timeFormat.replace(
      /[His]/g,
      a => ({
        H: currentDate.getHours().toString().padStart(2, '0'),
        i: currentDate.getMinutes().toString().padStart(2, '0'),
        s: currentDate.getSeconds().toString().padStart(2, '0')
      }[a])
  )
}

function onSetYear (event) {
  currentDate.setFullYear(event.target.value)
  setDays()
}

function onSetMonth (event) {
  currentDate.setMonth(event.target.value)
  setDays()
}

function onSetDay (event) {
  currentDate.setDate(event.target.value)
  setDays()
}

function onSetTime (event) {
  currentDate.setHours(...event.target.value.split(':').map(i => parseInt(i.replace(/[^\d+]/, '') || 0)))
}

function onSetDateTime () {
  setDays()
  destroy()
}

function setModel (value) {
  if (instance.exposed.model) {
    instance.exposed.model.value = value
  } else {
    instance.ctx.model = value
  }
}

function getModel () {
  return instance.exposed.model ? instance.exposed.model.value : instance.ctx.model
}

document.addEventListener('mousedown', () => {
  if (showDatepicker.value) {
    destroy()
  }
})
</script>

<template>
  <teleport to="body">
    <transition>
      <div v-show="showDatepicker"
           ref="datepicker"
           class="app-datepicker"
           :style="style"
           @mousedown.stop="">
        <div v-if="showDatepicker" class="app-datepicker__content">
          <table>
            <thead>
            <tr>
              <td colspan="4">
                <Select
                    :data="monthNames.map((value, key) => ({ key, value }))"
                    :value="currentDate.getMonth()"
                    class="text-sm"
                    input-class="input-sm"
                    @input="onSetMonth"/>
              </td>
              <td colspan="3">
                <Select
                    :data="Array.from({ length: (yearOffset * 2) + 1 }, (_, j) => (yearStart - yearOffset) + j).map(i => ({ key: i, value: i }))"
                    :value="currentDate.getFullYear()"
                    class="text-sm"
                    input-class="input-sm"
                    @input="onSetYear"/>
              </td>
            </tr>
            </thead>
            <tbody>
            <tr>
              <th v-for="i in Array.from({ length: 7 }, (_, j) => dayNames[(startDay + j) % 7])"
                  :title="i">
                {{ i.substring(0, dayChars) }}
              </th>
            </tr>
            <tr v-for="day in days">
              <td v-for="i in day">
                <label>
                  <input v-if="i.active"
                         type="radio"
                         name="app-datepicker-day"
                         :value="i.value"
                         :checked="currentDate.getDate() === i.value"
                         @input="onSetDay"/>
                  <span :class="[
                    i.active ? 'app-datepicker-day__active' : '',
                    i.active && i.current ? 'app-datepicker-day__current' : '',
                    i.active && i.selected ? 'app-datepicker-day__selected' : '',
                    ]">
                    {{ i.value }}
                  </span>
                </label>
              </td>
            </tr>
            </tbody>
            <tfoot>
            <tr>
              <td colspan="5">
                <Input :value="getTime()" input-class="input-sm" @input="onSetTime"/>
              </td>
              <td colspan="2">
                <Button value="OK" input-class="btn-sm btn-green" @click="onSetDateTime"/>
              </td>
            </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.app-datepicker {
  @apply absolute z-50 top-0 py-0.5
}
.app-datepicker__content {
  @apply relative overflow-hidden bg-white dark:bg-gray-700 border shadow-2xl rounded
}
.app-datepicker table {
  @apply border-collapse border-spacing-0 w-full
}
.app-datepicker th, .app-datepicker td {
  @apply text-center;
}
.app-datepicker thead td, .app-datepicker tfoot td {
  @apply px-1 first:pl-2 last:pr-2 py-2
}
.app-datepicker tbody th {
  @apply bg-gray-50 dark:bg-gray-600
}
.app-datepicker th:nth-child(6), .app-datepicker th:nth-child(7), .app-datepicker td:nth-child(6), .app-datepicker td:nth-child(7) {
  @apply text-rose-500
}
.app-datepicker tbody label {
  @apply overflow-hidden relative block w-10 h-10
}
.app-datepicker tbody label input {
  @apply absolute w-0 h-0 invisible
}
.app-datepicker tbody label span {
  @apply flex justify-center items-center w-full h-full opacity-50 rounded transition
}
.app-datepicker tbody label span.app-datepicker-day__active {
  @apply opacity-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600
}
.app-datepicker tbody label span.app-datepicker-day__current {
  @apply !bg-green-500 !text-white
}
.app-datepicker tbody label span.app-datepicker-day__selected {
  @apply !bg-blue-600 !text-white
}
.app-datepicker select, .app-datepicker input, .app-datepicker button {
  @apply py-0.5 px-1 h-auto
}
.app-datepicker button {
  @apply w-full justify-center
}
</style>
