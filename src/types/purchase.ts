/**
 * 영양제 구매 등록 요청
 *
 * supplementId는 URL에서 전달하므로 제외한다.
 *
 * 실제 SupplementPurchaseCreateRequest DTO의
 * 필드명이 동일한지 확인해야 한다.
 */
export type PurchaseCreateRequest = {
  purchaseDate: string;       // 구매일 yyyy-MM-dd
  purchasePrice: number;      // 구매 가격
  purchaseSource: string;     // 구매처
  purchaseQuantity: number;   // 구매 수량(통)
};