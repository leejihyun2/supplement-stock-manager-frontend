import type { PurchaseCreateRequest } from "../types/purchase";

/**
 * 영양제 구매 등록
 *
 * Spring Boot:
 * POST /supplements/{supplementId}/purchases
 *
 * 성공 시 201 Created 반환
 */
export async function createPurchase(
  supplementId: number,
  request: PurchaseCreateRequest
): Promise<void> {

  // Vite Proxy를 통해 Spring Boot에 요청 전달
  const response = await fetch(
    `/api/supplements/${supplementId}/purchases`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      // 구매 정보를 JSON 문자열로 변환
      body: JSON.stringify(request),
    }
  );

  // HTTP 200~299 범위는 정상 처리
  // 현재 백엔드에서는 201 Created 반환
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("해당 영양제를 찾을 수 없습니다.");
    }

    throw new Error(
      `구매 등록 실패 (HTTP ${response.status})`
    );
  }
}
