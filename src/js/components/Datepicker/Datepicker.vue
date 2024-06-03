<script>
import('./Datepicker.css')

export default {
  name: 'Datepicker',
  data () {
    return {
      instance: null,
      showDatepicker: false,
      selectDatepicker: false,
      position: {
        left: 0,
        top: 0
      },
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
      daysInMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
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
      currentDate: new Date(),
      days: []
    }
  },
  methods: {
    make (instance) {
      this.instance = instance
      this.currentDate = new Date()

      this.onShowDatepicker()
    },
    destroy () {
      this.onCloseDatepicker()
    },
    onClear (event) {
      this.$emit('action', 'clear:input', event, this)
    },
    onShowDatepicker () {
      this.showDatepicker = true

      const patterns = {
        'dd/mm/YYYY': '^(?<day>0[1-9]|[12][0-9]|3[01])\\/(?<month>0[1-9]|1[0-2])\\/(?<year>\\d{4})$',
        'mm/dd/YYYY': '^(?<month>0[1-9]|1[0-2])\\/(?<day>0[1-9]|[12][0-9]|3[01])\\/(?<year>\\d{4})$',
        'YYYY/dd/mm': '^(?<year>\\d{4})\\/(?<day>0[1-9]|[12][0-9]|3[01])\\/(?<month>0[1-9]|1[0-2])$',
        'YYYY/mm/dd': '^(?<year>\\d{4})\\/(?<month>0[1-9]|1[0-2])\\/(?<day>0[1-9]|[12][0-9]|3[01])$',
        'dd-mm-YYYY': '^(?<day>0[1-9]|[12][0-9]|3[01])-(?<month>0[1-9]|1[0-2])-(?<year>\\d{4})$',
        'mm-dd-YYYY': '^(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12][0-9]|3[01])-(?<year>\\d{4})$',
        'YYYY-dd-mm': '^(?<year>\\d{4})-(?<day>0[1-9]|[12][0-9]|3[01])-(?<month>0[1-9]|1[0-2])$',
        'YYYY-mm-dd': '^(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12][0-9]|3[01])$',
        'dd.mm.YYYY': '^(?<day>0[1-9]|[12][0-9]|3[01])\.(?<month>0[1-9]|1[0-2])\.(?<year>\\d{4})$',
        'mm.dd.YYYY': '^(?<month>0[1-9]|1[0-2])\.(?<day>0[1-9]|[12][0-9]|3[01])\.(?<year>\\d{4})$',
        'YYYY.dd.mm': '^(?<year>\\d{4})\.(?<day>0[1-9]|[12][0-9]|3[01])\.(?<month>0[1-9]|1[0-2])$',
        'YYYY.mm.dd': '^(?<year>\\d{4})\.(?<month>0[1-9]|1[0-2])\.(?<day>0[1-9]|[12][0-9]|3[01])$'
      }

      const d = (this.instance.model || '').toString().split(' ')

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
          this.currentDate = new Date()
          this.currentDate.setFullYear(parseInt(groups['year']), parseInt(groups['month']), parseInt(groups['day']))

          if (time) {
            const t = time.split(':')
            this.currentDate.setHours(parseInt(t[0] ?? 0), parseInt(t[1] ?? 0), parseInt(t[2] ?? 0))
          }

          break
        }
      }

      this.$nextTick(() => {
        const position = this.instance.$refs.input.getBoundingClientRect()
        let top

        if (position.top + position.height + this.$refs.datepicker.offsetHeight + 10 > window.innerHeight) {
          top = position.top - this.$refs.datepicker.offsetHeight
        } else {
          top = position.top + position.height
        }

        this.position = {
          left: position.left + 'px',
          top: top + 'px'
        }
      })

      this.setDays()
    },
    onCloseDatepicker () {
      this.showDatepicker = this.selectDatepicker
    },
    onSelectDatepicker () {
      this.showDatepicker = true
      this.selectDatepicker = true
    },
    setDatetime () {
      this.showDatepicker = false
      this.instance.model = this.currentDate.toLocaleDateString() + ' ' + this.currentDate.toLocaleTimeString()
    },
    setYear (event) {
      this.currentDate.setFullYear(event.target.value)
      this.setDays()
    },
    setMonth (event) {
      this.currentDate.setMonth(event.target.value)
      this.setDays()
    },
    setDay (event) {
      this.currentDate.setMonth(this.currentDate.getMonth(), event.target.value)
      this.setDays()
    },
    setTime (event) {
      this.currentDate.setHours(...event.target.value.split(':'))
    },
    setDays () {
      const currentDate = new Date(
          this.currentDate.getFullYear() + '-' + (this.currentDate.getMonth() + 1) + '-01')
      let firstDay = 1 - (7 + currentDate.getDay() - this.startDay) % 7
      let week = 0

      const days = []
      this.daysInMonth[1] = currentDate.getFullYear() % 4 === 0 ? 29 : 28

      const nowDate = {
        year: (new Date).getFullYear(),
        month: (new Date).getMonth(),
        day: (new Date).getDate()
      }

      while (firstDay <= this.daysInMonth[currentDate.getMonth()]) {
        days[week] = []

        for (let i = 0; i <= 6; i++) {
          days[week][i] = {
            active: false,
            value: null,
            current: null
          }

          if (firstDay <= this.daysInMonth[currentDate.getMonth()] && firstDay > 0) {
            days[week][i].value = firstDay
            days[week][i].active = true
          } else {
            days[week][i].value = firstDay > 0
                ? firstDay - this.daysInMonth[currentDate.getMonth()]
                : (this.daysInMonth[currentDate.getMonth() - 1] || this.daysInMonth[11]) + firstDay
          }

          if (
              currentDate.getDate() === firstDay &&
              currentDate.getMonth() === this.currentDate.getMonth() &&
              currentDate.getFullYear() === this.currentDate.getFullYear()
          ) {
            days[week][i].selected = true
          }

          if (
              firstDay === nowDate.day &&
              currentDate.getMonth() === nowDate.month &&
              currentDate.getFullYear() === nowDate.year
          ) {
            days[week][i].current = true
          }

          firstDay++

          if (i === 6) {
            week++
          }
        }
      }

      this.days = days
    }
  }
}
</script>

<template>
  <teleport v-if="showDatepicker" to="body">
    <div class="app-datepicker"
         ref="datepicker"
         :style="{ left: position.left, top: position.top }"
         @mousedown.stop="onSelectDatepicker">
      <div class="app-datepicker__content">
        <table>
          <thead>
          <tr>
            <td colspan="5">
              <select @input="setMonth">
                <option v-for="(i, k) in monthNames"
                        :value="k"
                        :selected="currentDate.getMonth() === k">
                  {{ i }}
                </option>
              </select>
            </td>
            <td colspan="2">
              <select @input="setYear">
                <option
                    v-for="i in Array.from({ length: (yearOffset * 2) + 1 }, (_, j) => (yearStart - yearOffset) + j)"
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
            <th v-for="i in Array.from({ length: 7 }, (_, j) => this.dayNames[(this.startDay + j) % 7])"
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
                       @input="setDay">
                <span :class="[
                    i.active ? 'app-datepicker-day__active' : '',
                    i.current ? 'app-datepicker-day__current' : '',
                    i.selected ? 'app-datepicker-day__selected' : '',
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
              <input type="text" :value="currentDate.toLocaleTimeString()" @input="setTime">
            </td>
            <td colspan="2">
              <button type="button" class="w-full justify-center btn-blue" @click="setDatetime">OK</button>
            </td>
          </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </teleport>
</template>
