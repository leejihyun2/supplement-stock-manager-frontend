
import type {
  DepletionCalendarItem,
} from "../types/depletionCalendar";

/**
 * 월별 소진일 캘린더 조회
 *
 * Spring Boot:
 * GET /supplements/calendar/depletions?yearMonth=2026-11
 *
 * @param yearMonth 조회 월 (yyyy-MM)
 * @param signal 요청 취소용 AbortSignal
 */
export async function getDepletionCalendar(
  yearMonth: string,
  signal?: AbortSignal
): Promise<DepletionCalendarItem[]> {

  // 조회할 연월이 yyyy-MM 형식인지 확인
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(yearMonth)) {
    throw new Error("조회 월은 yyyy-MM 형식이어야 합니다.");
  }

  // Vite Proxy를 통해 Spring Boot API 호출
  const response = await fetch(
    `/api/supplements/calendar/depletions?yearMonth=${yearMonth}`,
    { signal }
  );

  // HTTP 오류 처리
  if (!response.ok) {
    throw new Error(
      `소진일 캘린더 조회 실패 (HTTP ${response.status})`
    );
  }

  // 응답 JSON
  const data: unknown = await response.json();

  // 객체와 배열 구조 검증
  if (
    typeof data !== "object" ||
    data === null ||
    !("depletions" in data) ||
    !Array.isArray(data.depletions)
  ) {
    throw new Error(
      "캘린더 API 응답에 depletions 배열이 없습니다."
    );
  }

  // 실제 API 데이터를 React에서 사용하는 구조로 변환
  return data.depletions.map((value: unknown) => {
    if (
      typeof value !== "object" ||
      value === null
    ) {
      throw new Error("소진 예정 영양제 데이터가 올바르지 않습니다.");
    }

    const item = value as Record<string, unknown>;

    // name 또는 supplementName 필드에 대응
    const name = item.name ?? item.supplementName;

    if (
      !Number.isSafeInteger(item.supplementId) ||
      Number(item.supplementId) <= 0 ||
      typeof name !== "string" ||
      typeof item.expectedDepletionDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.expectedDepletionDate)
    ) {
      throw new Error(
        "소진일 데이터의 필드명 또는 값을 확인해주세요."
      );
    }

    return {
      supplementId: Number(item.supplementId),
      name,
      expectedDepletionDate: item.expectedDepletionDate,
    };
  });
}
