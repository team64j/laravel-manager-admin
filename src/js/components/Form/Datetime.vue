<script>
import Field from './Field.vue'
import { watchEffect } from 'vue'

const options = {
  format: 'dd-mm-yyyy hh:mm:00',
  yearOrder: 'asc',
  yearRange: 10,
  yearOffset: -10,
  yearStart: new Date().getFullYear(),
  monthNames: [
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
  ],
  daysInMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
  startDay: 7,
  dayChars: 1,
  dayNames: [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]
}

export default {
  __isStatic: true,
  name: 'Datetime',
  extends: Field,
  props: {
    data: {
      type: Object,
      default: {}
    }
  },
  data () {
    return {
      // monthNames: (this.data.monthNames && this.data.monthNames.length === 12 ?
      //     this.data.monthNames : options.monthNames) || options.monthNames,
      daysInMonth: (this.data.daysInMonth && this.data.daysInMonth.length === 12 ?
          this.data.daysInMonth : options.daysInMonth) || options.daysInMonth,
      // dayNames: (this.data.dayNames && this.data.dayNames.length === 7 ?
      //     this.data.dayNames : options.dayNames) || options.dayNames,
      format: this.data.format || options.format,
      //startDay: this.data.startDay || options.startDay,
      //dayChars: this.data.dayChars || options.dayChars,
      //yearStart: this.data.yearStart || options.yearStart,
      yearRange: this.data.yearRange || options.yearRange,
      yearOrder: this.data.yearOrder || options.yearOrder,
      // yearOffset: this.data.yearOffset || options.yearOffset,

      showDatepicker: false,
      yearStart: new Date().getFullYear(),
      yearOffset: 10,
      monthNames: [
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
      ],
      dayNames: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ],
      dayChars: 2,
      startDay: 1,
      days: [],
      currentDate: {
        year: 2024,
        month: 4,
        day: 5
      }
    }
  },
  computed: {
    model: {
      get () {
        return this.value ?? this.modelValue ?? ''
      },
      set (value) {
        this.$emit('update:modelValue', value, this)
      }
    }
  },
  methods: {
    onClear (event) {
      this.$emit('action', 'clear:input', event, this)
    },
    onShowDatepicker () {
      this.showDatepicker = !this.showDatepicker

      if (this.showDatepicker) {
        watchEffect(() => {
          if (this.currentDate) {
            this.days = []
            const date = new Date()
            let firstDay = 1 - (7 + date.getDay() - this.startDay) % 7
            let a = 0
            const nowDate = {
              year: date.getFullYear(),
              month: date.getMonth(),
              day: date.getDate()
            }

            while (firstDay <= this.daysInMonth[this.currentDate.month]) {
              this.days[a] = []

              for (let i = 0; i <= 6; i++) {
                this.days[a][i] = {}

                if (firstDay <= this.daysInMonth[this.currentDate.month] && firstDay > 0) {
                  this.days[a][i].axis = this.currentDate.year + '|' + (this.currentDate.month + 1) + '|' +
                      firstDay
                  this.days[a][i].value = firstDay
                } else {
                  this.days[a][i].value = ''
                }

                // if (firstDay === parseInt(this.$refs.input.oldDay) &&
                //     dateInput.month === this.$refs.input.oldMonth &&
                //     dateInput.year === this.$refs.input.oldYear) {
                //   this.days[a][i].selected = true
                // }

                if (firstDay === nowDate.day &&
                    this.currentDate.month === nowDate.month &&
                    this.currentDate.year === nowDate.year) {
                  this.days[a][i].today = true
                }

                firstDay++

                if (i === 6) {
                  a++
                }
              }
            }
          }

        })
      }
    },
    onCloseDatepicker () {
      this.showDatepicker = false
    },
    create () {
      if (this.$refs.input.calendar) {
        return false
      }

      let y = void 0

      this.getValue()

      this.$refs.input.interval = null
      this.$refs.input.autocomplete = 'off'
      this.$refs.input.lastValidDate = this.$refs.input.value

      this.$refs.input.nowYear = this.$refs.input.today.getFullYear()
      this.$refs.input.nowMonth = this.$refs.input.today.getMonth()
      this.$refs.input.nowDay = this.$refs.input.today.getDate()

      this.$refs.input.oldYear = this.$refs.input.year = this.$refs.input.then.getFullYear()
      this.$refs.input.oldMonth = this.$refs.input.month = this.$refs.input.then.getMonth()
      this.$refs.input.oldDay = this.$refs.input.then.getDate()

      this.$refs.input.dirty = false

      document.onmousedown = (e) => this.close(e)
      document.onkeydown = (e) => {
        if (e.code === 9 && !e.shift || e.code === 27 || e.code === 13) {
          if (e.code === 13 && this.$refs.input.calendar) {
            e.preventDefault()
            if (this.$refs.input.dirty) {
              this.updateValue()
            }
            this.remove()
            this.alertError()
          } else {
            this.remove()
          }
        }
      }

      this.$refs.input.calendar = document.createElement('div')
      this.$refs.input.calendar.className = 'app-datepicker'

      document.body.appendChild(this.$refs.input.calendar)

      const date = new Date()

      if (this.$refs.input.month >= 0 && this.$refs.input.year) {
        date.setFullYear(this.$refs.input.year, this.$refs.input.month, 1)
      } else {
        this.$refs.input.month = date.getMonth()
        this.$refs.input.year = date.getFullYear()
        date.setDate(1)
      }

      this.$refs.input.year % 4 === 0 ? this.daysInMonth[1] = 29 : this.daysInMonth[1] = 28
      let firstDay = 1 - (7 + date.getDay() - this.startDay) % 7
      const monthSel = document.createElement('select')

      for (let m = 0; m < this.monthNames.length; m++) {
        monthSel.options[m] = new Option(this.monthNames[m], m.toString())
        if (parseInt(this.$refs.input.month) === m) {
          monthSel.options[m].selected = true
        }
      }

      const yearSel = document.createElement('select')

      yearSel.id = this.$refs.input.id + '_yearSelect'

      let i = 0
      if (!this.yearStart) {
        this.yearStart = date.getFullYear()
      }

      if (this.yearOrder === 'desc') {
        for (y = this.yearStart - this.yearOffset; y > this.yearStart - this.yearRange - 1;
            y--) {
          yearSel.options[i] = new Option(y.toString(), y.toString())
          if (parseInt(this.$refs.input.year) === y) {
            yearSel.options[i].selected = true
          }
          i++
        }
      } else {
        for (y = this.yearStart + this.yearOffset; y < this.yearStart + this.yearRange + 1;
            y++) {
          yearSel.options[i] = new Option(y, y)
          if (parseInt(this.$refs.input.year) === y) {
            yearSel.options[i].selected = true
          }
          i++
        }
      }

      let time = void 0

      if (!this.$refs.input.time) {
        const d = new Date(this.$refs.input.thenvalue)
        let minutes = d.getMinutes()
        if (minutes < 10) {
          minutes = '0' + minutes
        }
        time = d.getHours() + ':' + minutes
      } else {
        time = this.$refs.input.time
      }

      const timeTextBox = document.createElement('input')
      timeTextBox.id = this.$refs.input.id + '_timeTextBox'
      timeTextBox.type = 'text'
      timeTextBox.value = time

      const submitButton = document.createElement('button')
      submitButton.id = this.$refs.input.id + '_submit'
      submitButton.className = 'btn-green justify-center w-full'
      submitButton.innerHTML = 'OK'

      const calTable = document.createElement('table')

      const calTableThead = document.createElement('thead')

      const calSelRow = document.createElement('tr')

      const calSelCell1 = document.createElement('th')
      const calSelCell2 = document.createElement('th')

      calSelCell1.colSpan = 4
      calSelCell1.appendChild(monthSel)

      calSelCell2.colSpan = 3
      calSelCell2.appendChild(yearSel)

      calSelRow.appendChild(calSelCell1)
      calSelRow.appendChild(calSelCell2)
      calTableThead.appendChild(calSelRow)

      const calTableTbody = document.createElement('tbody')

      const calDayNameRow = document.createElement('tr')

      let calDayNameCell = void 0

      for (i = 0; i < this.dayNames.length; i++) {
        calDayNameCell = document.createElement('th')
        calDayNameCell.innerHTML = this.dayNames[(this.startDay + i) % 7].substring(0, this.dayChars)
        calDayNameRow.appendChild(calDayNameCell)
      }

      calTableTbody.appendChild(calDayNameRow)

      let calDayRow = void 0
      let calDayCell = void 0

      while (firstDay <= this.daysInMonth[this.$refs.input.month]) {
        calDayRow = document.createElement('tr')
        for (i = 0; i < 7; i++) {
          calDayCell = document.createElement('td')
          if (firstDay <= this.daysInMonth[this.$refs.input.month] && firstDay > 0) {
            calDayCell.className = this.$refs.input.id + '_calDay'
            calDayCell.dataset.axis = this.$refs.input.year + '|' + (parseInt(this.$refs.input.month) + 1) + '|' +
                firstDay
            calDayCell.innerHTML = '<span>' + firstDay.toString() + '</span>'
          } else {
            calDayCell.innerHTML = ''
          }

          calDayRow.appendChild(calDayCell)

          if (firstDay === parseInt(this.$refs.input.oldDay) && this.$refs.input.month === this.$refs.input.oldMonth &&
              this.$refs.input.year === this.$refs.input.oldYear) {
            calDayCell.classList.add('dp_selected')
          }

          if (firstDay === this.$refs.input.nowDay && parseInt(this.$refs.input.month) === this.$refs.input.nowMonth &&
              parseInt(this.$refs.input.year) === this.$refs.input.nowYear) {
            calDayCell.classList.add('dp_today')
          }

          firstDay++
        }
        calTableTbody.appendChild(calDayRow)
      }

      const calTableFoot = document.createElement('tfoot')
      const calTableFootTh1 = document.createElement('td')
      calTableFootTh1.colSpan = 5
      calTableFootTh1.appendChild(timeTextBox)

      const calTableFootTh2 = document.createElement('td')
      calTableFootTh2.colSpan = 2
      calTableFootTh2.appendChild(submitButton)

      calTableFoot.appendChild(calTableFootTh1)
      calTableFoot.appendChild(calTableFootTh2)

      calTable.appendChild(calTableThead)
      calTable.appendChild(calTableTbody)
      calTable.appendChild(calTableFoot)

      this.$refs.input.calendar.appendChild(calTable)

      this.$refs.input.position = this.$refs.input.getBoundingClientRect()
      this.$refs.input.calendar.style.left = this.$refs.input.position.left + window.scrollX + 'px'

      if (this.$refs.input.position.top + this.$refs.input.position.height + this.$refs.input.calendar.offsetHeight >
          window.innerHeight) {
        this.$refs.input.calendar.style.top = this.$refs.input.position.top + window.scrollY -
            this.$refs.input.calendar.offsetHeight + 'px'
      } else {
        this.$refs.input.calendar.style.top = this.$refs.input.position.top + this.$refs.input.position.height +
            window.scrollY + 'px'
      }

      const calDays = document.querySelectorAll('td.' + this.$refs.input.id + '_calDay')

      for (i = 0; i < calDays.length; i++) {
        calDays[i].onmouseover = (e) => e.target.classList.add('dp_roll')
        calDays[i].onmouseout = (e) => e.target.classList.remove('dp_roll')

        calDays[i].onclick = (e) => {
          const el = document.querySelector('td.dp_selected')
          if (el) {
            el.classList.remove('dp_selected')
          }
          e.target.classList.add('dp_selected')
          this.updateValue()
        }

        calDays[i].ondblclick = (e) => {
          const el = document.querySelector('td.dp_selected')
          if (el) {
            el.classList.remove('dp_selected')
          }
          e.target.classList.add('dp_selected')
          this.updateValue()
          this.remove()
        }
      }
      monthSel.onfocus = () => this.$refs.input.active = true
      monthSel.onblur = () => this.$refs.input.active = true
      yearSel.onfocus = () => this.$refs.input.active = true
      yearSel.onblur = () => this.$refs.input.active = true

      monthSel.onchange = () => {
        this.$refs.input.month = monthSel.value
        this.$refs.input.year = yearSel.value
        this.remove()
        this.create()
      }

      yearSel.onchange = () => {
        this.$refs.input.month = monthSel.value
        this.$refs.input.year = yearSel.value
        this.remove()
        this.create()
      }

      timeTextBox.onfocus = () => this.$refs.input.active = true

      timeTextBox.onblur = () => {
        this.updateValue()
        this.alertError()
      }

      timeTextBox.onkeyup = () => this.$refs.input.dirty = true

      submitButton.onclick = (e) => {
        if (this.$refs.input.dirty) {
          this.updateValue()
          this.alertError()
        }
        this.remove()
        e.stopPropagation()
      }
    },
    getValue () {
      if (this.$refs.input.value !== '') {
        if (this.format === 'dd-mm-YYYY hh:mm:00' || this.format === 'dd-mm-YYYY') {
          const dateVals = this.$refs.input.value.split(' ')
          const dateParts = dateVals[0].split('-')

          this.$refs.input.thenvalue = dateParts[1] + '/' + dateParts[0] + '/' + dateParts[2]

          if (dateVals[1]) {
            this.$refs.input.thenvalue = this.$refs.input.thenvalue + ' ' + dateVals[1]
          }
        } else {
          this.$refs.input.thenvalue = this.$refs.input.value
        }

        this.$refs.input.then = new Date(this.$refs.input.thenvalue)
        this.$refs.input.today = new Date()
      } else {
        this.$refs.input.thenvalue = this.$refs.input.then = this.$refs.input.today = new Date()
      }
    },
    updateValue () {
      const el = document.querySelector('td.dp_selected')

      let ds = void 0

      if (el) {
        ds = el.dataset.axis.split('|')
        const formatted = this.formatValue(ds[0], ds[1], ds[2])

        if (formatted !== '') {
          this.$refs.input.value = formatted
          this.$refs.input.lastValidDate = formatted
        }

        this.$refs.input.dirty = true
      }
    },
    alertError () {
      if (typeof this.$refs.input.error !== 'undefined' && this.$refs.input.error !== '') {
        alert(this.$refs.input.error)
        this.$refs.input.error = ''
      }
    },
    hasChild (a, b) {
      let parent = a.parentNode

      while (parent && parent !== document.body) {
        if (parent === b) {
          return parent
        } else {
          parent = parent.parentNode
        }
      }

      return null
    },
    close (e) {
      if (!document.querySelector('.app-datepicker')) {
        return
      }

      const clickOutside = e.target && e.target !== this.$refs.input && e.target !== this.$refs.input.calendar &&
          !this.hasChild(e.target, this.$refs.input.calendar)

      if (clickOutside) {
        if (this.$refs.input.dirty) {
          this.updateValue()
          this.alertError()
        }
        this.remove(this.dp)
      }
    },
    formatValue (year, month, day) {
      const time = document.getElementById(this.$refs.input.id + '_timeTextBox').value.split(':')

      if (!time[0] || time[0] === '' || time[0] < 0 || time[0] > 23) {
        this.$refs.input.error = 'Invalid hours value: ' + time[0] +
            '\nAllowed range is 00:23'
        return ''
      }

      if (!time[1] || time[1] === '' || time[1] < 0 || time[1] > 59 ||
          time[1].length !== 2) {
        this.$refs.input.error = 'Invalid minutes value: ' + time[1] +
            '\nAllowed range is 00:59'
        return ''
      }

      if (day < 10) {
        day = '0' + day
      }

      if (month < 10) {
        month = '0' + month
      }

      this.$refs.input.month = this.$refs.input.oldMonth = '' + (month - 1) + ''
      this.$refs.input.year = this.$refs.input.oldYear = year
      this.$refs.input.oldDay = day
      this.$refs.input.thenvalue = month + '/' + day + '/' + year + ' ' + time[0] + ':' + time[1] + ':00'

      return this.format.replace(/dd/i, day).
          replace(/mm/i, month).
          replace(/yyyy/i, year).
          replace(/hh/, time[0]).
          replace(/mm/, time[1])
    },
    remove () {
      this.$refs.input.active = false

      if (this.$refs.input.calendar) {
        this.$refs.input.calendar.remove()
      }

      this.$refs.input.calendar = false
    }
  }
}
</script>

<template>
  <div v-if="label" class="w-full mb-3" :class="$props.class">
    <div class="mb-1">
      <label :for="ID" class="font-bold cursor-pointer">
        {{ label }}
        <span v-if="required" class="text-rose-500">*</span>
        <i v-if="error" :data-tooltip="errorMessage" data-type="error" class="ml-2 font-normal"/>
        <i v-else-if="help" :data-tooltip="help" class="ml-2 font-normal"/>
      </label>
      <span v-if="requiredText" class="text-rose-500 ml-3 text-sm font-normal">{{ requiredText }}</span>
      <slot name="label"/>
    </div>
    <div class="relative">
      <div v-if="loading" class="absolute left-0 top-1 my-1 mx-2 flex items-center justify-center">
        <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
      </div>
      <input v-model="model"
             :id="ID"
             type="text"
             ref="input"
             :placeholder="placeholder"
             :class="[inputClass, error ? '!border-rose-500 focus:ring-rose-500' : '', loading ? '!text-transparent' : '']"
             :readonly="readonly"
             :required="required"
             :disabled="disabled"
             @focus="onShowDatepicker">
      <i v-if="clear"
         class="fa fa-circle-xmark absolute block right-0 top-0 my-4 mx-3 cursor-pointer text-gray-300 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-600 transition"
         @click="onClear"/>
    </div>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
    <slot name="item"/>
  </div>
  <div v-else class="relative" :class="[$props.class]">
    <div v-if="loading" class="absolute left-0 top-1 my-1 mx-2 flex items-center justify-center">
      <i class="inline-block rounded-full border-2 border-slate-200 border-r-slate-500 dark:border-white/20 dark:border-r-white h-5 w-5 animate-spin"/>
    </div>
    <input v-model="model"
           :id="ID"
           type="text"
           ref="input"
           :placeholder="placeholder"
           :class="[inputClass, error ? '!border-rose-500' : '', loading ? '!text-transparent' : '']"
           :readonly="readonly"
           :required="required"
           :disabled="disabled"
           @focus="onShowDatepicker">
    <i v-if="clear"
       class="fa fa-circle-xmark absolute block right-0 top-0 my-4 mx-3 cursor-pointer text-gray-300 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-600 transition"
       @click="onClear"/>
    <div v-if="description" v-html="description" class="opacity-75 text-sm"/>
  </div>

  <teleport v-if="showDatepicker" to="body">
    <div class="app-datepicker">
      <table>
        <thead>
        <tr>
          <td colspan="4">
            <select v-model="currentDate.month">
              <option v-for="(i, k) in monthNames" :value="k">{{ i }}</option>
            </select>
          </td>
          <td colspan="3">
            <select v-model="currentDate.year">
              <option
                  v-for="i in Array.from({ length: (yearOffset * 2) + 1 }, (_, j) => (yearStart - yearOffset) + j)"
                  :value="i">
                {{ i }}
              </option>
            </select>
          </td>
        </tr>
        <tr>
          <th v-for="i in Array.from({ length: 7 }, (_, j) => this.dayNames[(this.startDay + j) % 7])"
              :title="i">
            {{ i.substring(0, dayChars) }}
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="w in days">
          <td v-for="d in w" :data-today="d.today">
            {{ d.value }}
          </td>
        </tr>
        </tbody>
        <tfoot></tfoot>
      </table>
    </div>
  </teleport>
</template>

<style>
.app-datepicker {
  @apply absolute z-50 top-0 overflow-hidden bg-white dark:bg-gray-700 shadow-2xl rounded
}
.app-datepicker table {
  @apply border-collapse border-spacing-0 w-full
}
.app-datepicker th, .app-datepicker td {
  @apply text-center;
}
.app-datepicker td span {
  @apply inline-flex w-10 h-10 mt-0.5 mr-0.5 items-center justify-center pointer-events-none rounded;
}
.app-datepicker td:last-of-type span {
  @apply mr-0
}
.app-datepicker tbody td[data-axis] {
  @apply cursor-pointer first:pl-1 last:pr-1
}
.app-datepicker thead th, .app-datepicker tfoot td {
  @apply py-1 px-0.5 first:pl-1 last:pr-1
}
.app-datepicker tbody th {
  @apply bg-gray-600
}
.app-datepicker tbody th:nth-child(6), .app-datepicker tbody th:nth-child(7), .app-datepicker tbody td:nth-child(6), .app-datepicker tbody td:nth-child(7) {
  @apply text-rose-500
}
.app-datepicker .dp_hide {
  @apply hidden
}
.app-datepicker .dp_today span {
  @apply bg-green-600
}
.app-datepicker td.dp_roll:not(.dp_selected) span {
  @apply bg-blue-600/60 text-white
}
.app-datepicker .dp_selected span {
  @apply bg-blue-600 text-white rounded
}
</style>
