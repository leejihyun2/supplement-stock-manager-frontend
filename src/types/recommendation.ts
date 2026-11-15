/**
 * 주문 추천 목록의 영양제 한 개
 */
export type RecommendationItem = {
  supplementId: number;       // 영양제 ID
  supplementName: string;     // 영양제 이름
  currentStock: number;       // 현재 재고
  daysUntilDepletion: number; // 소진까지 남은 일수
};

/**
 * Spring Boot 주문 추천 API 응답
 *
 * {
 *   "recommendations": [...]
 * }
 */
export type OrderRecommendationResponse = {
  recommendations: RecommendationItem[];
};