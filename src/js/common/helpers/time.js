const format = require('date-fns/format');
const subDays = require('date-fns/subDays');
const addDaysFn = require('date-fns/addDays');

const duration = {
  milliseconds(val) {
    return val;
  },
  seconds(val) {
    return val * this.milliseconds(1000);
  },
  minutes(val) {
    return val * this.seconds(60);
  },
  hours(val) {
    return val * this.minutes(60);
  },
  days(val) {
    return val * this.hours(24);
  },
  weeks(val) {
    return val * this.days(7);
  },
  months(val) {
    return val * this.days(30);
  },
  years(val) {
    return val * this.days(365);
  }
};

const getTs = date => (new Date(date)).getTime();
const startOfDay = ts => new Date(ts).setHours(0, 0, 0, 0);
const endOfDay = ts => new Date(ts).setHours(23, 59, 59, 999);
const toUTC = ts => format(ts, 'YYYY-MM-dd');
const formatTime = ts => format(ts, 'YYYY-MM-dd HH:mm:ss');
const subtractDays = (ts, days) => subDays(ts, days);
const addDays = (ts, days) => addDaysFn(ts, days);
const isExpired = date => Date.now() > date;
const getYear = () => new Date(Date.now()).getFullYear();

const MAX_DATE = 864000000000000;

module.exports = {
  duration,
  getTs,
  startOfDay,
  endOfDay,
  toUTC,
  formatTime,
  subtractDays,
  addDays,
  isExpired,
  getYear,
  MAX_DATE
};
