// 백엔드에서 반환하는 영양제 목록 데이터의 타입
export type Supplement = {
  supplementId: number;
  supplementName: string;
  currentStock: number;
  daysUntilDepletion: number;
};

// 영양제 상세 조회 응답 데이터
export type SupplementDetail = {
  supplementId: number;
  supplementName: string;

  // 기본 정보
  totalQuantity: number;
  currentStock: number;
  unopenedBottleCount: number;
  servingSize: number;
  servingsPerDay: number;
  intakeSchedule: string | string[];

  // 백엔드에서 계산한 정보
  daysUntilDepletion: number;
  expectedDepletionDate: string | null;

  // 주문 추천 여부
  includedInCurrentRecommendation?: boolean;

  // 기존 백엔드에 해당 오타가 남아 있을 경우 대응
  includedInCurrentRecommendaion?: boolean;

  // 구매 정보가 없으면 null
  purchasePrice: number | null;
  purchaseSource: string | null;
};

// 영양제 최초 등록 요청 데이터
export type SupplementCreateRequest = {
  supplementName: string;       // 영양제 이름
  totalQuantity: number;        // 1통당 총 수량
  currentStock: number;         // 현재 재고
  unopenedBottleCount: number;  // 미개봉 통 수
  servingSize: number;          // 1회 섭취량
  servingsPerDay: number;       // 하루 섭취 횟수
  intakeSchedule: string;       // 섭취 요일
};

// 영양제 수정 요청 데이터
// 현재 등록 API와 수정 API의 요청 필드가 동일하므로 재사용
export type SupplementUpdateRequest = SupplementCreateRequest;