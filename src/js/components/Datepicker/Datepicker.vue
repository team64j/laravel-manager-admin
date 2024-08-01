<script>
import('./Datepicker.css')

export default {
  name: 'Datepicker',
  data () {
    return {
      instance: null,
      days: [],
      currentDate: null,
      showDatepicker: false,
      position: {
        left: 0,
        top: 0
      },
      dateFormat: this.$store.getters.get('config.datetime_format', 'dd-mm-YYYY'),
      yearStart: new Date().getFullYear(),
      yearOffset: 10,
      monthNames: this.$store.getters.get('lang.dp_monthNames', [
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
      dayNames: this.$store.getters.get('lang.dp_dayNames', [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ]),
      daysInMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
      dayChars: 1,
      startDay: parseInt(this.$store.getters.get('lang.dp_startDay', 1)),
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
  },
  mounted () {
    document.addEventListener('mousedown', () => {
      if (this.showDatepicker) {
        this.destroy()
      }
    })
  },
  methods: {
    make (instance) {
      this.instance = instance

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

      this.currentDate = new Date()

      for (const p in this.patterns) {
        const reg = new RegExp(this.patterns[p])

        if (reg.test(date)) {
          const groups = date.match(reg).groups
          this.currentDate.setFullYear(parseInt(groups['year']), parseInt(groups['month']) - 1, parseInt(groups['day']))

          if (time) {
            const t = time.split(':')
            this.currentDate.setHours(parseInt(t[0] ?? 0), parseInt(t[1] ?? 0), parseInt(t[2] ?? 0))
          }

          break
        }
      }

      this.yearStart = this.currentDate.getFullYear()
      this.showDatepicker = true

      this.setDays()

      this.$nextTick(() => {
        const position = this.instance.$refs.input.getBoundingClientRect()
        let top, left = position.left

        if (position.top + position.height + this.$refs.datepicker.offsetHeight + 16 > window.innerHeight) {
          top = position.top - this.$refs.datepicker.offsetHeight
        } else {
          top = position.top + position.height
        }

        if (position.left + this.$refs.datepicker.offsetWidth + 16 > window.innerWidth) {
          left = window.innerWidth - this.$refs.datepicker.offsetWidth - 16
        }

        this.position = {
          left: left + 'px',
          top: top + 'px'
        }
      })
    },
    destroy () {
      this.showDatepicker = false
    },
    clear (ctx) {
      ctx.model = ''
    },
    setDays () {
      const days = []
      const currentDate = new Date(this.currentDate.getFullYear() + '-' + (this.currentDate.getMonth() + 1) + '-01')
      let day = 1 - (7 + currentDate.getDay() - this.startDay) % 7
      let week = 0

      this.daysInMonth[1] = currentDate.getFullYear() % 4 === 0 ? 29 : 28

      while (day <= this.daysInMonth[currentDate.getMonth()]) {
        days[week] = []

        for (let i = 0; i <= 6; i++) {
          days[week][i] = {
            active: false,
            value: null,
            current: null
          }

          if (day <= this.daysInMonth[currentDate.getMonth()] && day > 0) {
            days[week][i].value = day
            days[week][i].active = true
          } else {
            days[week][i].value = day > 0
                ? day - this.daysInMonth[currentDate.getMonth()]
                : (this.daysInMonth[currentDate.getMonth() - 1] || this.daysInMonth[11]) + day
          }

          if (
              days[week][i].value === this.currentDate.getDate() &&
              currentDate.getMonth() === this.currentDate.getMonth() &&
              currentDate.getFullYear() === this.currentDate.getFullYear()
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

      this.days = days
      this.instance.model = this.getDate() + ' ' + this.getTime()
    },
    getDate () {
      return this.dateFormat.replace('dd', (this.currentDate.getDate() > 9 ? '' : '0') + this.currentDate.getDate()).
          replace('mm', (this.currentDate.getMonth() + 1 > 9 ? '' : '0') + (this.currentDate.getMonth() + 1)).
          replace('YYYY', this.currentDate.getFullYear().toString())
    },
    getTime () {
      return this.currentDate.getHours() + ':' + this.currentDate.getMinutes() + ':' + this.currentDate.getSeconds()
    },
    onSetYear (event) {
      this.currentDate.setFullYear(event.target.value)
      this.setDays()
    },
    onSetMonth (event) {
      this.currentDate.setMonth(event.target.value)
      this.setDays()
    },
    onSetDay (event) {
      this.currentDate.setDate(event.target.value)
      this.setDays()
    },
    onSetTime (event) {
      this.currentDate.setHours(...event.target.value.split(':').map(i => parseInt(i.replace(/[^\d+]/, '') || 0)))
    },
    onSetDateTime () {
      this.setDays()
      this.destroy()
    }
  }
}
</script>

<template>
  <teleport v-if="showDatepicker" to="body">
    <div class="app-datepicker"
         ref="datepicker"
         :style="{ left: position.left, top: position.top }"
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
  </teleport>
</template>
