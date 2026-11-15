// 복용 상태
export type IntakeStatus = "CHECKED" | "UNCHECKED";

// 오늘 복용 체크리스트 항목
export type IntakeChecklistItem = {
  supplementId: number;

  // null이면 오늘 복용기록이 아직 생성되지 않았다는 의미
  intakeId: number | null;

  name: string;

  // 하루 복용량 = 1회 섭취량 × 하루 섭취 횟수
  dailyQuantity: number;

  status: IntakeStatus;
};

// 최초 복용 체크 요청
export type IntakeCreateRequest = {
  supplementId: number;
  date: string; // YYYY-MM-DD
};

// 기존 복용기록 상태 변경 요청
export type IntakeStatusUpdateRequest = {
  status: IntakeStatus;
};