
import { useEffect, useState } from "react";
import { Link } from "react-router";

import {
  ArrowLeft,
  CalendarDays,
  House,
  List,
  SquareCheckBig,
  CheckCircle2,
} from "lucide-react";

import {
  getTodayIntakeChecklist,
  createIntake,
  updateIntakeStatus,
} from "../api/intakeApi";

import type { IntakeChecklistItem } from "../types/intake";

import "./IntakePage.css";

// 오늘 날짜를 YYYY-MM-DD 형식으로 생성
// UTC가 아니라 브라우저의 현지 날짜를 사용한다.
function getTodayDate(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// 오늘 날짜를 화면에 한국어로 표시
function formatToday(): string {
  const now = new Date();

  return now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function IntakePage() {
  // 오늘 복용 체크리스트 데이터
  const [intakes, setIntakes] = useState<IntakeChecklistItem[]>([]);

  // 최초 조회 상태
  const [loading, setLoading] = useState(true);

  // API 오류 메시지
  const [error, setError] = useState<string | null>(null);

  // 현재 API 처리 중인 영양제 ID
  const [busyId, setBusyId] = useState<number | null>(null);

  // 상태 변경 후 재조회 실패 시 중복 체크를 방지
  const [needsRefresh, setNeedsRefresh] = useState(false);

  // 재조회 버튼 클릭 시 증가시키는 값
  const [reloadKey, setReloadKey] = useState(0);

  /**
   * 화면 진입 시 오늘 복용 목록 조회
   * GET /intake/today
   */
  useEffect(() => {
    const controller = new AbortController();

    async function loadIntakes() {
      try {
        setLoading(true);
        setError(null);

        const data = await getTodayIntakeChecklist(getTodayDate());

        if (!controller.signal.aborted) {
          setIntakes(data);
          setNeedsRefresh(false);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "복용 목록 조회 중 오류가 발생했습니다."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadIntakes();

    // 페이지 종료 시 진행 중인 조회 요청 취소
    return () => controller.abort();
  }, [reloadKey]);

  /**
   * 체크박스 클릭 처리
   *
   * 1. 기존 복용기록 존재 여부 확인
   * 2. 최초 체크면 POST
   * 3. 기존 기록이 있으면 PATCH
   * 4. 성공 후 오늘 복용 목록 재조회
   */
  async function handleIntakeCheck(item: IntakeChecklistItem) {
    // 다른 요청 처리 중이면 추가 요청 차단
    if (busyId !== null || needsRefresh || loading) {
      return;
    }

    // 이미 체크되었는데 기록 ID가 없으면 데이터 불일치
    if (
      item.status === "CHECKED" &&
      item.intakeId === null
    ) {
      setError("복용기록 ID가 없습니다. 목록을 다시 조회해주세요.");
      setNeedsRefresh(true);
      return;
    }

    try {
      setBusyId(item.supplementId);
      setError(null);

      // 현재 상태에 따라 변경할 상태 계산
      const nextStatus =
        item.status === "CHECKED"
          ? "UNCHECKED"
          : "CHECKED";

      // ① 아직 복용기록이 없다면 최초 체크
      if (item.intakeId === null) {
        await createIntake({
          supplementId: item.supplementId,
          date: getTodayDate(),
        });
      }

      // ② 이미 복용기록이 있다면 상태 변경
      else {
        await updateIntakeStatus(item.intakeId, {
          status: nextStatus,
        });
      }

      // 서버의 최신 체크 상태와 intakeId를 다시 가져온다.
      // 특히 최초 체크 이후 생성된 intakeId가 중요하다.
      setNeedsRefresh(true);

      // 복용 체크 및 취소 후 최신 상태 재조회
        const updated = await getTodayIntakeChecklist(getTodayDate());

      setIntakes(updated);
      setNeedsRefresh(false);

    } catch (err) {
      // 요청이 서버에서 처리되었을 가능성도 있으므로
      // 재조회 전까지 체크박스 조작을 막는다.
      setNeedsRefresh(true);

      setError(
        err instanceof Error
          ? `${err.message} 현재 상태를 다시 확인해주세요.`
          : "복용 처리 중 오류가 발생했습니다."
      );
    } finally {
      setBusyId(null);
    }
  }

  // 체크 완료된 영양제 수
  const checkedCount = intakes.filter(
    (item) => item.status === "CHECKED"
  ).length;

  // 전체 영양제 수
  const totalCount = intakes.length;

  // 오늘 복용 완료 비율
  const progress =
    totalCount === 0
      ? 0
      : (checkedCount / totalCount) * 100;

  return (
    <div className="intake-page">

      {/* 상단 헤더 */}
      <header className="intake-header">
        <Link
          to="/supplements"
          className="intake-back"
          aria-label="영양제 목록으로 돌아가기"
        >
          <ArrowLeft size={24} />
        </Link>

        <h1>오늘 체크</h1>
      </header>

      <main className="intake-content">

        {/* 오늘 날짜 */}
        <section className="intake-date">
          <CalendarDays size={21} />
          <h2>{formatToday()}</h2>
        </section>

        {/* 오늘 복용 현황 */}
        <section className="intake-summary">
          <div className="intake-summary-top">
            <div>
              <span className="intake-summary-label">
                오늘 복용 현황
              </span>

              <h3>
                {checkedCount}
                <span> / {totalCount}개 완료</span>
              </h3>
            </div>

            <div className="intake-summary-icon">
              <CheckCircle2 size={26} />
            </div>
          </div>

          {/* 완료 비율 */}
          <div
            className="intake-progress"
            role="progressbar"
            aria-label="오늘 복용 완료율"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="intake-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {/* 복용 체크리스트 */}
        <section className="intake-list-card">
          <h3 className="intake-list-title">
            오늘 먹어야 할 영양제
          </h3>

          {loading ? (
            <p className="intake-message">
              복용 목록을 불러오는 중입니다.
            </p>
          ) : intakes.length === 0 ? (
            <p className="intake-message">
              오늘 복용할 영양제가 없습니다.
            </p>
          ) : (
            <div className="intake-list">
              {intakes.map((item) => {
                const checked =
                  item.status === "CHECKED";

                const busy =
                  busyId === item.supplementId;

                return (
                  <label
                    className={`intake-item ${
                      checked ? "checked" : ""
                    }`}
                    key={item.supplementId}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={
                        loading ||
                        busyId !== null ||
                        needsRefresh
                      }
                      onChange={() => handleIntakeCheck(item)}
                      aria-label={`${item.name} 복용 ${
                        checked ? "취소" : "체크"
                      }`}
                    />

                    <span className="intake-item-name">
                      {item.name}
                    </span>

                    <span className="intake-item-quantity">
                      {item.dailyQuantity}정
                    </span>

                    {busy && (
                      <span className="intake-item-loading">
                        처리 중
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </section>

        {/* 오류 메시지 및 재조회 */}
        {error && (
          <div className="intake-error" role="alert">
            <p>{error}</p>

            <button
              type="button"
              disabled={loading || busyId !== null}
              onClick={() => setReloadKey((prev) => prev + 1)}
            >
              다시 조회
            </button>
          </div>
        )}

        {/* 모든 영양제 복용 완료 */}
        {!loading &&
          !error &&
          totalCount > 0 &&
          checkedCount === totalCount && (
            <p className="intake-complete-message">
              오늘 복용할 영양제를 모두 체크했어요!
            </p>
          )}
      </main>

      {/* 하단 네비게이션 */}
      <nav
        className="intake-bottom-nav"
        aria-label="하단 메뉴"
      >
        {/* 홈 화면은 이후 구현 */}
        <span className="intake-nav-item intake-nav-disabled">
          <House size={23} />
          <span>홈</span>
        </span>

        <span
          className="intake-nav-item active"
          aria-current="page"
        >
          <SquareCheckBig size={23} />
          <span>오늘 체크</span>
        </span>

        <Link
          to="/supplements"
          className="intake-nav-item"
        >
          <List size={23} />
          <span>영양제 목록</span>
        </Link>

        {/* 캘린더 화면은 이후 구현 */}
        <span className="intake-nav-item intake-nav-disabled">
          <CalendarDays size={23} />
          <span>캘린더</span>
        </span>
      </nav>
    </div>
  );
}

export default IntakePage;
