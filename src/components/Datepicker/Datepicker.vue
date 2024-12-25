<script setup>
import { nextTick, reactive, ref } from 'vue'
import store from '../../store'

defineOptions({
  name: 'Datepicker'
})

defineExpose({
  on: make,
  off: destroy
})

const $data = reactive({
  showDatepicker: false,
  position: {
    left: 0,
    top: 0
  },
  yearStart: new Date().getFullYear(),
  yearOffset: 10,
  days: []
})

let instance = null

const datepicker = ref(null)

const dateFormat = store.getters.get('config.datetime_format', 'dd-mm-YYYY')

const timeFormat = 'H:i:s'

const monthNames = store.getters.get('lang.dp_monthNames', [
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

const dayNames = store.getters.get('lang.dp_dayNames', [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
])

const startDay = parseInt(store.getters.get('lang.dp_startDay', 1))

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

function make (self) {
  const d = self.ctx['model'] ? (self.ctx['model'] || '').toString().split(' ') : []
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

  instance = self
  $data.yearStart = currentDate.getFullYear()
  $data.showDatepicker = true

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

    $data.position = {
      left: left + 'px',
      top: top + 'px'
    }
  })

  setDays()
}

function destroy () {
  $data.showDatepicker = false
}

function clear (ctx) {
  ctx.model = ''
}

function setDays () {
  const days = []
  let day = 1 - (7 + currentDate.getDay() - startDay) % 7
  let week = 0

  daysInMonth[1] = currentDate.getFullYear() % 4 === 0 ? 29 : 28

  while (day <= daysInMonth[currentDate.getMonth()]) {
    days[week] = []

    for (let i = 0; i <= 6; i++) {
      days[week][i] = {
        active: false,
        value: null,
        current: null
      }

      if (day <= daysInMonth[currentDate.getMonth()] && day > 0) {
        days[week][i].value = day
        days[week][i].active = true
      } else {
        days[week][i].value = day > 0
            ? day - daysInMonth[currentDate.getMonth()]
            : (daysInMonth[currentDate.getMonth() - 1] || daysInMonth[11]) + day
      }

      if (
          days[week][i].value === currentDate.getDate() &&
          currentDate.getMonth() === currentDate.getMonth() &&
          currentDate.getFullYear() === currentDate.getFullYear()
      ) {
        days[week][i].selected = true
      }

      if (
          day === (new Date).getDate() &&
          currentDate.getMonth() === (new Date).getMonth() &&
          currentDate.getFullYear() === (new Date).getFullYear()
      ) {
        days[week][i].current = true
      }

      day++

      if (i === 6) {
        week++
      }
    }
  }

  $data.days = days
  instance.ctx.model = getDate() + ' ' + getTime()
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

document.addEventListener('mousedown', () => {
  if ($data.showDatepicker) {
    destroy()
  }
})
</script>

<template>
  <teleport to="body">
    <transition>
      <div v-show="$data.showDatepicker"
           ref="datepicker"
           class="app-datepicker"
           :style="$data.position"
           @mousedown.stop="() => null">
        <div class="app-datepicker__content">
          <table>
            <thead>
            <tr>
              <td colspan="5">
                <select @input="onSetMonth">
                  <option v-for="(i, k) in monthNames"
                          :value="k"
                          :selected="currentDate.getMonth() === k">
                    {{ i }}
                  </option>
                </select>
              </td>
              <td colspan="2">
                <select @input="onSetYear">
                  <option
                      v-for="i in Array.from({ length: ($data.yearOffset * 2) + 1 }, (_, j) => ($data.yearStart - $data.yearOffset) + j)"
                      :value="i"
                      :selected="currentDate.getFullYear() === i">
                    {{ i }}
                  </option>
                </select>
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
            <tr v-for="day in $data.days">
              <td v-for="i in day">
                <label>
                  <input v-if="i.active"
                         type="radio"
                         name="app-datepicker-day"
                         :value="i.value"
                         :checked="currentDate.getDate() === i.value"
                         @input="onSetDay">
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
                <input type="text" :value="getTime()" @input="onSetTime">
              </td>
              <td colspan="2">
                <button type="button" @click="onSetDateTime">
                  OK
                </button>
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
  @apply py-0.5 px-1
}
.app-datepicker button {
  @apply w-full justify-center
}
</style>
