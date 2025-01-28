<script setup>
import { nextTick, reactive, ref, shallowRef, watch } from 'vue'
import store from '../../store'
import Radio from '../Radio/Radio.vue'
import Select from '../Select/Select.vue'

defineOptions({
  name: 'Datepicker'
})

defineExpose({
  on: make,
  off: destroy
})

let currentDate = ref(new Date())

const data = reactive({
  days: [],
  current: {
    year: currentDate.value.getFullYear(),
    month: currentDate.value.getMonth(),
    day: currentDate.value.getDay(),
    hours: currentDate.value.getHours(),
    minutes: currentDate.value.getMinutes(),
    seconds: currentDate.value.getSeconds()
  }
})

let instance = null
const datepicker = shallowRef()
const show = ref(false)

const options = {
  dateFormat: store.getters.get('config.datetimeFormat', 'dd-mm-YYYY'),
  timeFormat: 'H:i:s',
  yearOffset: 10,
  monthNames: store.getters.get('lang.monthNames', [
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
  ]),
  daysInMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
  dayNames: store.getters.get('lang.dayNames', [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]),
  startDay: parseInt(store.getters.get('lang.startDay', 1)),
  dayChars: 1,
  patterns: {
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
}

const days = ref()

watch(
    () => data.current,
    (value) => {
      currentDate.value.setFullYear(value.year)
      currentDate.value.setMonth(value.month)
      currentDate.value.setDate(value.day)
      currentDate.value.setHours(value.hours)
      currentDate.value.setMinutes(value.minutes)
      currentDate.value.setSeconds(value.seconds)
    },
    { deep: true }
)

function make (self) {
  instance = self

  const d = getModel() ? (getModel() || '').toString().split(' ') : []
  currentDate.value = new Date()

  let date
  let time

  if (/:/.test(d[0])) {
    date = d[1] ?? ''
    time = d[0] ?? ''
  } else {
    date = d[0] ?? ''
    time = d[1] ?? ''
  }

  for (const p in options.patterns) {
    const reg = new RegExp(options.patterns[p])

    if (reg.test(date)) {
      const groups = date.match(reg).groups
      currentDate.value.setFullYear(parseInt(groups['year']), parseInt(groups['month']) - 1, parseInt(groups['day']))

      if (time) {
        const t = time.split(':')
        currentDate.value.setHours(parseInt(t[0] ?? 0), parseInt(t[1] ?? 0), parseInt(t[2] ?? 0))
      }

      break
    }
  }

  show.value = true

  data.current.day = currentDate.value.getDay()
  data.current.month = currentDate.value.getMonth()
  data.current.year = currentDate.value.getFullYear()

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

    datepicker.value.style.left = `${left}px`
    datepicker.value.style.top = `${top}px`
  })

  console.log(currentDate)

  setDays()
}

function setDays () {
  const date = new Date(data.current.year + '-' + (data.current.month + 1) + '-01')
  let day = 1 - (7 + date.getDay() - options.startDay) % 7, week = 0
  options.daysInMonth[1] = date.getFullYear() % 4 === 0 ? 29 : 28

  days.value = []

  while (day <= options.daysInMonth[date.getMonth()]) {
    days.value[week] = []

    for (let i = 0; i <= 6; i++) {
      days.value[week][i] = {
        active: false,
        value: null,
        current: null
      }

      if (day <= options.daysInMonth[date.getMonth()] && day > 0) {
        days.value[week][i].value = day
        days.value[week][i].active = true
      } else {
        days.value[week][i].value = day > 0
            ? day - options.daysInMonth[date.getMonth()]
            : (options.daysInMonth[date.getMonth() - 1] || options.daysInMonth[11]) + day
      }

      if (
          days.value[week][i].value === data.current.day &&
          date.getMonth() === data.current.month &&
          date.getFullYear() === data.current.year
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

function destroy () {
  show.value = false
}

function getDate () {
  return options.dateFormat.replace(
      /dd|mm|YYYY/g,
      a => ({
        dd: currentDate.value.getDay().toString().padStart(2, '0'),
        mm: (currentDate.value.getMonth() + 1).toString().padStart(2, '0'),
        YYYY: currentDate.value.getFullYear()
      }[a])
  )
}

function getTime () {
  return options.timeFormat.replace(
      /[His]/g,
      a => ({
        H: currentDate.value.getHours().toString().padStart(2, '0'),
        i: currentDate.value.getMinutes().toString().padStart(2, '0'),
        s: currentDate.value.getSeconds().toString().padStart(2, '0')
      }[a])
  )
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
  if (show.value) {
    destroy()
  }
})
/*
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

  data.current.day = currentDate.getDay()
  data.current.month = currentDate.getMonth()
  data.current.year = currentDate.getFullYear()

  watch(
      () => data.current,
      setDays,
      { deep: true }
  )

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
  const date = new Date(data.current.year + '-' + (data.current.month + 1) + '-01')
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
          days.value[week][i].value === data.current.day &&
          date.getMonth() === data.current.month &&
          date.getFullYear() === data.current.year
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

      days.value[week][i].date = dateFormat.replace(
          /dd|mm|YYYY/g,
          a => ({
            dd: days.value[week][i].value.toString().padStart(2, '0'),
            mm: (date.getMonth() + 1).toString().padStart(2, '0'),
            YYYY: date.getFullYear()
          }[a])) + ' ' + getTime()

      day++

      if (i === 6) {
        week++
      }
    }
  }

  console.log(days)

  setModel(getDate() + ' ' + getTime())
}

function getDate () {
  return dateFormat.replace(
      /dd|mm|YYYY/g,
      a => ({
        dd: data.current.day.toString().padStart(2, '0'),
        mm: (data.current.month + 1).toString().padStart(2, '0'),
        YYYY: data.current.year
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

  console.log(data.current)
}

function getModel () {
  return instance.exposed.model ? instance.exposed.model.value : instance.ctx.model
}

document.addEventListener('mousedown', () => {
  if (showDatepicker.value) {
    destroy()
  }
})*/
</script>

<template>
  <teleport to="body">
    <transition>
      <div v-show="show" ref="datepicker" @mousedown.stop=""
           class="absolute z-50 top-0 py-0.5 w-80 bg-white dark:bg-gray-700 border shadow-2xl rounded">
        <table class="border-collapse border-spacing-0 table-fixed w-full">
          <thead>
          <tr>
            <td colspan="4">
              <Select v-model="data.current.month"
                      :data="options.monthNames.map((i, k) => ({ key: k, value: i }))"/>
            </td>
            <td colspan="3">
              <Select v-model="data.current.year"
                      :data="Array.from({ length: (options.yearOffset * 2) + 1 }, (_, j) => (currentDate.getFullYear() - options.yearOffset) + j).map(i => ({ key: i, value: i }))"/>
            </td>
          </tr>
          </thead>
          <tbody>
          <tr>
            <th v-for="i in Array.from({ length: 7 }, (_, j) => options.dayNames[(options.startDay + j) % 7])"
                :data-tooltip="i"
                class="[&:nth-child(6)]:text-rose-500 [&:nth-child(7)]:text-rose-500">
              {{ i.substring(0, options.dayChars) }}
            </th>
          </tr>
          <tr v-for="day in days">
            <td v-for="i in day" :data-data="JSON.stringify(i)">
              <Radio
                  v-model="data.current.day"
                  :value="i.active ? i.value : null"
                  :as-button="true"
                  :disabled="!i.active"
                  :description="i.value"
                  :label-class="['!p-0 rounded', i.active && i.current ? 'bg-green-500' : '']"
              />
            </td>
          </tr>
          </tbody>
          <!--          <tfoot>
                    <tr>
                      <td colspan="5">
                        <input type="text" :value="getTime()" @input="onSetTime">
                      </td>
                      <td colspan="2">
                        <Button type="button" @click="onSetDateTime" value="OK"/>
                      </td>
                    </tr>
                    </tfoot>-->
        </table>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
</style>
