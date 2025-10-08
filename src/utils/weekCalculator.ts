// src/utils/weekCalculator.ts
import { WeekInfo } from '../types';

const WEEK_START = 1; // 1 = Monday

function cloneDate(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeekISO(d: Date): Date {
  const dd = cloneDate(d);
  const day = dd.getDay();
  const diff = (day - WEEK_START + 7) % 7;
  dd.setDate(dd.getDate() - diff);
  dd.setHours(0, 0, 0, 0);
  return dd;
}

/**
 * 해당 달의 모든 주차를 반환 (목요일 귀속, 1주차부터 시작)
 */
export function getWeeksOfMonth(year: number, month: number): WeekInfo[] {
  const month0 = month - 1;
  const result: WeekInfo[] = [];
  let weekIdx = 1;

  // 1일이 속한 주의 월요일부터 시작
  let monday = startOfWeekISO(new Date(year, month0, 1));

  while (true) {
    const thursday = cloneDate(monday);
    thursday.setDate(monday.getDate() + 3);

    if (thursday.getMonth() === month0) {
      // 이 주의 목요일이 해당 달에 속하면, 이 주는 해당 달의 주차
      result.push({
        year,
        month,
        week: weekIdx,
        display: `${year}년 ${month}월 ${weekIdx}주차`,
      });
      weekIdx++;
    }

    // 다음 주로 이동
    monday.setDate(monday.getDate() + 7);

    // 종료 조건: 월요일이 다음 달로 넘어가면 끝
    if (monday.getMonth() > month0 || monday.getFullYear() > year) break;
  }

  return result;
}

/**
 * 오늘이 속한 주차(해당 달 기준, 1-based)를 반환
 */
export function getWeekOfMonth(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const weeks = getWeeksOfMonth(year, month);
  const monday = startOfWeekISO(date);

  for (const w of weeks) {
    // 각 주차의 월요일 구하기
    const weekMonday = startOfWeekISO(new Date(year, month - 1, 1));
    weekMonday.setDate(weekMonday.getDate() + 7 * (w.week - 1));
    if (weekMonday.getTime() === monday.getTime()) {
      return w.week;
    }
  }
  return 0; // 해당 달에 속하지 않는 주
}

/** 현재 주차 정보 */
export function getCurrentWeekInfo(): WeekInfo {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const week = getWeekOfMonth(now);

  return {
    year,
    month,
    week,
    display: `${year}년 ${month}월 ${week}주차 (이번주)`,
  };
}

/** n주 전 주차 정보 (달 넘어가도 정확) */
export function getPreviousWeekInfo(weeksAgo: number): WeekInfo {
  const base = new Date();
  const target = new Date(base);
  target.setDate(base.getDate() - weeksAgo * 7);

  const year = target.getFullYear();
  const month = target.getMonth() + 1;
  const week = getWeekOfMonth(target);

  return {
    year,
    month,
    week,
    display: `${year}년 ${month}월 ${week}주차`,
  };
}

/**
 * 최근 3개 주차(이번주 포함)를 반환 (항상 1주차부터 시작, 목요일 귀속)
 */
export function getAvailableWeeks(): WeekInfo[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 이번달 주차 목록
  let weeks = getWeeksOfMonth(year, month);

  // 오늘이 속한 주차 찾기
  const todayMonday = startOfWeekISO(now);
  let thisWeekIdx = weeks.findIndex(w => {
    const monday = startOfWeekISO(new Date(w.year, w.month - 1, 1));
    monday.setDate(monday.getDate() + 7 * (w.week - 1));
    return todayMonday.getTime() === monday.getTime();
  });

  // 못 찾으면 마지막 주차(예외적 상황)
  if (thisWeekIdx === -1) thisWeekIdx = weeks.length - 1;

  // 3개 미만이면 이전 달에서 부족분 채우기
  if (thisWeekIdx < 2) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevWeeks = getWeeksOfMonth(prevYear, prevMonth);
    const need = 2 - thisWeekIdx;
    weeks = [...prevWeeks.slice(-need), ...weeks];
    thisWeekIdx += need;
  }

  // 최근 3개 주차 반환 (이번주 포함, 최신순)
  return weeks.slice(thisWeekIdx - 2, thisWeekIdx + 1).reverse();
}

/**
 * 시험 주차가 현재 주차보다 이전인지 판단
 * - 문자열 동등 비교 대신 연/월/주 숫자 비교 (안전)
 * - examWeekDisplay 예: "2025년 10월 2주차"
 */
export function isPreviousWeek(examWeekDisplay: string): boolean {
  const m = examWeekDisplay.match(/(\d{4})년\s+(\d{1,2})월\s+(\d{1,2})주차/);
  if (!m) return true; // 포맷 이상 시 이전으로 간주
  const exam = {
    year: Number(m[1]),
    month: Number(m[2]),
    week: Number(m[3]),
  };

  const cur = getCurrentWeekInfo();

  if (exam.year !== cur.year) return exam.year < cur.year;
  if (exam.month !== cur.month) return exam.month < cur.month;
  return exam.week < cur.week;
}
