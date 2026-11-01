
import type { Supplement } from "../types/supplement";

// 실제 Spring Boot 응답 데이터의 타입
type SupplementListApiResponse = {
  supplements: {
    supplementId: number;
    supplementName: string;
    currentStock: number;
    daysUntilDepletion: number;
  }[];
};

/**
 * 전체 영양제 목록 조회
 * Spring Boot: GET /supplements
 */
export async function getSupplements(
  signal?: AbortSignal
): Promise<Supplement[]> {

  // Spring Boot API 호출
  const response = await fetch("/api/supplements", { signal });

  // HTTP 오류 처리
  if (!response.ok) {
    throw new Error(`영양제 조회 실패: HTTP ${response.status}`);
  }

  // JSON 응답을 객체로 변환
  const data: SupplementListApiResponse = await response.json();

  // supplements 필드가 배열인지 확인
  if (!Array.isArray(data.supplements)) {
    throw new Error("영양제 목록이 배열 형식이 아닙니다.");
  }

  // 백엔드 필드명을 프론트엔드 타입에 맞게 변환
  return data.supplements.map((item) => ({
    supplementId: item.supplementId,
    supplementName: item.supplementName,
    currentStock: item.currentStock,
    daysUntilDepletion: item.daysUntilDepletion,
  }));
}
