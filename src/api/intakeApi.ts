import type {
  IntakeChecklistItem,
  IntakeCreateRequest,
  IntakeStatusUpdateRequest,
  IntakeStatus,
} from "../types/intake";

/*
 * 백엔드 API 경로
 *
 * 실제 Spring Boot Controller의 매핑과 다르면
 * 여기의 URL만 수정하면 된다.
 *
 * 예전 명세를 사용하는 경우:
 * today: /api/intake-checklist?date=YYYY-MM-DD
 * create: /api/intake-records
 */
const INTAKE_API = {
  // 오늘 복용 체크리스트 조회
  today: (date: string) =>
    `/api/intake-checklist?date=${encodeURIComponent(date)}`,

  // 최초 복용 체크
  create: "/api/intake-records",

  // 기존 복용 상태 변경
  update: (intakeId: number) =>
    `/api/intake-records/${intakeId}`,
};

// JSON 값이 객체인지 검사
function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/*
 * 백엔드에서 반환한 체크리스트를
 * React에서 사용할 데이터 형태로 변환
 */
function parseChecklist(data: unknown): IntakeChecklistItem[] {
  let rows: unknown;

  // 배열을 직접 반환하는 API
  if (Array.isArray(data)) {
    rows = data;
  }
  // 객체 안에 배열이 포함된 API
  else if (isObject(data)) {
    rows =
      data.intakeChecklist ??
      data.checklist ??
      data.items;
  }

  if (!Array.isArray(rows)) {
    throw new Error(
      "체크리스트 API 응답 구조를 확인해주세요."
    );
  }

  return rows.map((value) => {
    if (!isObject(value)) {
      throw new Error("복용 체크리스트 항목이 올바르지 않습니다.");
    }

    // 백엔드 DTO에서 사용하는 이름을 공통 필드로 변환
    const supplementId = Number(value.supplementId);

    const name = value.name ?? value.supplementName;

    const dailyQuantity = Number(
      value.dailyQuantity ??
      value.dailyIntakeQuantity
    );

    const rawId = value.intakeId ?? value.intakeRecordId;

    // 기존 기록이 없으면 null
    const intakeId =
      rawId === null || rawId === undefined
        ? null
        : Number(rawId);

    const rawStatus =
      value.status ??
      value.intakeStatus ??
      (
        typeof value.taken === "boolean"
          ? value.taken ? "CHECKED" : "UNCHECKED"
          : undefined
      );

    // 데이터 검증
    if (
      !Number.isSafeInteger(supplementId) ||
      supplementId <= 0 ||
      typeof name !== "string" ||
      !Number.isFinite(dailyQuantity) ||
      dailyQuantity < 0 ||
      (intakeId !== null &&
        (!Number.isSafeInteger(intakeId) || intakeId <= 0)) ||
      (rawStatus !== "CHECKED" &&
        rawStatus !== "UNCHECKED")
    ) {
      throw new Error(
        "체크리스트 데이터의 필드명 또는 값이 올바르지 않습니다."
      );
    }

    const status = rawStatus as IntakeStatus;

    return {
      supplementId,
      intakeId,
      name,
      dailyQuantity,
      status,
    };
  });
}

/**
 * 오늘 복용 체크리스트 조회
 * GET /intake-checklist?date=2026-09-26
 */
export async function getTodayIntakeChecklist(
  date: string,           // 조회할 날짜
  signal?: AbortSignal    // API 요청 취소용
): Promise<IntakeChecklistItem[]> {

  // 날짜를 전달하여 실제 API URL 생성
  const response = await fetch(INTAKE_API.today(date), {
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `복용 체크리스트 조회 실패 (HTTP ${response.status})`
    );
  }

  const data: unknown = await response.json();

  // 기존 응답 변환 함수 재사용
  return parseChecklist(data);
}

/**
 * 최초 복용 체크
 * POST /intake-records
 *
 * 기존 복용기록이 없을 때만 호출한다.
 */
export async function createIntake(
  request: IntakeCreateRequest
): Promise<void> {

  const response = await fetch(INTAKE_API.create, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(
      `최초 복용 체크 실패 (HTTP ${response.status})`
    );
  }
}

/**
 * 기존 복용기록 상태 변경
 * PATCH /intake-records/{intakeId}
 *
 * CHECKED   -> UNCHECKED: 취소 + 재고 복구
 * UNCHECKED -> CHECKED  : 재체크 + 재고 차감
 */
export async function updateIntakeStatus(
  intakeId: number,
  request: IntakeStatusUpdateRequest
): Promise<void> {

  const response = await fetch(
    INTAKE_API.update(intakeId),
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    throw new Error(
      `복용 상태 변경 실패 (HTTP ${response.status})`
    );
  }
}
