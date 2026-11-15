import type {
  OrderRecommendationResponse,
  RecommendationItem,
} from "../types/recommendation";

/**
 * 이번 주문 추천 목록 조회
 *
 * Spring Boot:
 * GET /supplements/order-recommendations
 *
 * 백엔드에서 이미 14일 이내 소진 예정인
 * 영양제만 계산하여 반환한다.
 */
export async function getOrderRecommendations(
  signal?: AbortSignal
): Promise<RecommendationItem[]> {

  // Vite Proxy를 통해 Spring Boot API 호출
  const response = await fetch(
    "/api/supplements/order-recommendations",
    { signal }
  );

  // HTTP 오류 처리
  if (!response.ok) {
    throw new Error(
      `주문 추천 목록 조회 실패 (HTTP ${response.status})`
    );
  }

  // Spring Boot JSON 응답
  const data: OrderRecommendationResponse =
    await response.json();

  // 백엔드의 recommendations가 배열인지 확인
  if (!Array.isArray(data.recommendations)) {
    throw new Error(
      "주문 추천 API 응답 구조가 올바르지 않습니다."
    );
  }

  // 필수 데이터가 누락되었는지 확인
  const valid = data.recommendations.every(
    (item) =>
      Number.isSafeInteger(item.supplementId) &&
      item.supplementId > 0 &&
      typeof item.supplementName === "string" &&
      Number.isFinite(item.currentStock) &&
      Number.isFinite(item.daysUntilDepletion)
  );

  if (!valid) {
    throw new Error(
      "주문 추천 데이터의 필드명을 확인해주세요."
    );
  }

  // 백엔드에서 반환한 추천 영양제 목록
  return data.recommendations;
}
