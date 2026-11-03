import type {
  Supplement,
  SupplementDetail,
} from "../types/supplement";

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

/**
 * 영양제 상세 조회
 * GET /supplements/{supplementId}
 *
 * @param supplementId 조회할 영양제 ID
 * @param signal 요청 취소를 위한 AbortSignal
 */
export async function getSupplementDetail(
  supplementId: number,
  signal?: AbortSignal
): Promise<SupplementDetail> {

  // Vite Proxy를 통해 Spring Boot API 호출
  const response = await fetch(
    `/api/supplements/${supplementId}`,
    { signal }
  );

  // 영양제를 찾을 수 없는 경우
  if (response.status === 404) {
    throw new Error("해당 영양제를 찾을 수 없습니다.");
  }

  // 그 외 HTTP 오류 처리
  if (!response.ok) {
    throw new Error(
      `영양제 상세 조회 실패: HTTP ${response.status}`
    );
  }

  // Spring Boot Response DTO를 JSON으로 받는다
  const data: unknown = await response.json();

  // 상세 조회 API는 직접 객체를 반환한다고 가정
  if (
    typeof data !== "object" ||
    data === null ||
    !("supplementId" in data)
  ) {
    throw new Error("상세 조회 API 응답 형식이 올바르지 않습니다.");
  }

  return data as SupplementDetail;
}