// 백엔드에서 반환하는 영양제 목록 데이터의 타입
export type Supplement = {
  supplementId: number;
  supplementName: string;
  currentStock: number;
  dayUntilDepletion: number;
};