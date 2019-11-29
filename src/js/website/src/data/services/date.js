import format from 'date-fns/format';
import isValid from 'date-fns/isValid';
import eachDayOfInterval from 'date-fns/eachDayOfInterval';
import {startOfDay, duration} from 'Common/helpers/time';
import formatDistance from 'date-fns/formatDistance';

export const formatDate = ts => format(ts, 'dd/MM/YYYY', {awareOfUnicodeTokens: true});
export const formatDateYearFirst = (ts = Date.now()) => format(ts, 'YYYY-MM-dd', {awareOfUnicodeTokens: true});
export const formatDatetime = ts => format(ts, 'dd/MM/YYYY HH:mm', {awareOfUnicodeTokens: true});
export const formatTime = ts => format(ts * 1000, 'HH:mm', {awareOfUnicodeTokens: true});

export const getLastNDaysLabels = days => {
  const start = startOfDay(new Date()) - duration.days(days - 1);
  const end = startOfDay(new Date());

  return eachDayOfInterval({start, end}).map(day => format(day, 'E', {awareOfUnicodeTokens: true}));
};

export const getLastNdays = days => {
  const start = startOfDay(new Date()) - duration.days(days - 1);
  const end = startOfDay(new Date());

  return eachDayOfInterval({start, end}).map(Number);
};

export const isValidDate = d => isValid(d);
export const timeTo = date => formatDistance(date, Date.now(), {addSuffix: true});
