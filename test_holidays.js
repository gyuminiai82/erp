const Holidays = require('date-holidays');
const hd = new Holidays('KR');
console.log(hd.getHolidays(2026));
