/**
 * 소진 예정 영양제 한 개
 */
export type DepletionCalendarItem = {
  supplementId: number;         // 영양제 ID
  name: string;                 // 영양제 이름
  expectedDepletionDate: string; // 예상 소진일 yyyy-MM-dd
};

/**
 * 월별 소진일 캘린더 API 응답
 */
export type DepletionCalendarResponse = {
  depletions: DepletionCalendarItem[];
};