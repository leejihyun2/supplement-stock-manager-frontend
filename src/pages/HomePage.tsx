
import { useEffect, useState } from "react";
import { Link } from "react-router";

import {
  HeartPulse,
  Pill,
  SquareCheckBig,
  ShoppingCart,
  CalendarDays,
  ChevronRight,
  CheckCircle2,
  Circle,
  RefreshCw,
} from "lucide-react";

// 기존에 구현한 API 함수 재사용
import { getSupplements } from "../api/supplementApi";
import { getTodayIntakeChecklist } from "../api/intakeApi";
import { getOrderRecommendations } from "../api/recommendationApi";
import { getDepletionCalendar } from "../api/depletionCalendarApi";

// 기존 TypeScript 타입 재사용
import type { Supplement } from "../types/supplement";
import type { IntakeChecklistItem } from "../types/intake";
import type { RecommendationItem } from "../types/recommendation";
import type { DepletionCalendarItem } from "../types/depletionCalendar";

import "./HomePage.css";

/**
 * 홈 대시보드에서 사용하는 데이터
 *
 * 기존 API 응답을 하나로 관리한다.
 */
type HomeDashboardData = {
  supplements: Supplement[];
  intakes: IntakeChecklistItem[];
  recommendations: RecommendationItem[];
  calendar: DepletionCalendarItem[];
};

// API별 오류 상태
type HomeApiErrors =
  Partial<Record<keyof HomeDashboardData, string>>;

/**
 * 현지 날짜를 yyyy-MM-dd 형식으로 변환
 *
 * toISOString()은 UTC 기준이기 때문에
 * 한국 날짜와 차이가 생길 수 있어 사용하지 않는다.
 */
function getTodayDate(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * 오늘 날짜를 화면에 표시
 */
function formatToday(): string {
  return new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

/**
 * 소진일까지 남은 일수를 문구로 변환
 */
function getDepletionText(days: number): string {
  if (days < 0) return "소진 예정일 경과";
  if (days === 0) return "오늘 소진";

  return `${days}일 후 소진`;
}

/**
 * 소진 임박 정도에 따른 CSS 클래스
 */
function getDepletionStatus(days: number): string {
  if (days <= 7) return "danger";

  return "warning";
}

/**
 * 소진 예정일을 화면에 표시
 * yyyy-MM-dd -> M월 d일
 */
function formatDepletionDate(date: string): string {
  const [, month, day] = date.split("-");

  return `${Number(month)}월 ${Number(day)}일`;
}

/**
 * 홈 대시보드 페이지
 */
function HomePage() {

  // 오늘 날짜
  const today = getTodayDate();

  // 이번 달 yyyy-MM
  const yearMonth = today.slice(0, 7);

  /**
   * 기존 API 4개의 결과를 저장한다.
   */
  const [dashboard, setDashboard] =
    useState<HomeDashboardData>({
      supplements: [],
      intakes: [],
      recommendations: [],
      calendar: [],
    });

  // 전체 API 로딩 상태
  const [loading, setLoading] = useState(true);

  // API별 오류를 따로 저장
  const [errors, setErrors] = useState<HomeApiErrors>({});

  // 새로고침 버튼을 눌렀을 때 증가시키는 값
  const [reloadKey, setReloadKey] = useState(0);

  /**
   * 홈 화면 진입 시 기존 백엔드 API 4개 호출
   *
   * 1. 영양제 목록 조회
   * 2. 오늘 복용 체크리스트 조회
   * 3. 이번 주문 추천 조회
   * 4. 이번 달 소진일 캘린더 조회
   *
   * Promise.allSettled()를 사용하므로
   * 하나의 API가 실패해도 다른 API의 결과는
   * 정상적으로 화면에 표시할 수 있다.
   */
  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setLoading(true);
      setErrors({});

      const [
        supplementsResult,
        intakesResult,
        recommendationsResult,
        calendarResult,
      ] = await Promise.allSettled([
        getSupplements(controller.signal),

        getTodayIntakeChecklist(
          today,
          controller.signal
        ),

        getOrderRecommendations(controller.signal),

        getDepletionCalendar(
          yearMonth,
          controller.signal
        ),
      ] as const);

      // 페이지가 이동되어 요청이 취소되었으면
      // React 상태를 변경하지 않는다.
      if (controller.signal.aborted) return;

      // 성공한 API 데이터만 사용
      setDashboard({
        supplements:
          supplementsResult.status === "fulfilled"
            ? supplementsResult.value
            : [],

        intakes:
          intakesResult.status === "fulfilled"
            ? intakesResult.value
            : [],

        recommendations:
          recommendationsResult.status === "fulfilled"
            ? recommendationsResult.value
            : [],

        calendar:
          calendarResult.status === "fulfilled"
            ? calendarResult.value
            : [],
      });

      // 실패한 API의 오류를 별도로 저장
      setErrors({
        supplements:
          supplementsResult.status === "rejected"
            ? "영양제 목록 조회에 실패했습니다."
            : undefined,

        intakes:
          intakesResult.status === "rejected"
            ? "오늘 복용 현황 조회에 실패했습니다."
            : undefined,

        recommendations:
          recommendationsResult.status === "rejected"
            ? "주문 추천 목록 조회에 실패했습니다."
            : undefined,

        calendar:
          calendarResult.status === "rejected"
            ? "소진일 캘린더 조회에 실패했습니다."
            : undefined,
      });

      setLoading(false);
    }

    void loadDashboard();

    // 페이지 종료 시 API 요청 취소
    return () => controller.abort();

  }, [today, yearMonth, reloadKey]);

  /**
   * 오늘 복용 현황 계산
   */

  // 전체 복용 대상 영양제 수
  const totalIntakes = dashboard.intakes.length;

  // 복용 완료 영양제 수
  const checkedIntakes = dashboard.intakes.filter(
    (item) => item.status === "CHECKED"
  ).length;

  // 복용 완료 비율
  const intakeProgress =
    totalIntakes === 0
      ? 0
      : Math.round(
          (checkedIntakes / totalIntakes) * 100
        );

  /**
   * 이번 주문 추천 목록
   *
   * 백엔드에서 이미 14일 이내 소진 예정인
   * 영양제만 반환하므로 필터링하지 않는다.
   *
   * 소진일이 가까운 순서로 정렬한 후
   * 홈에는 최대 3개만 표시한다.
   */
  const recommendedSupplements = [
    ...dashboard.recommendations,
  ].sort(
    (a, b) =>
      a.daysUntilDepletion - b.daysUntilDepletion
  );

  const topRecommendations =
    recommendedSupplements.slice(0, 3);

  /**
   * 이번 달 남은 소진 예정 목록
   *
   * 이미 지난 소진일은 홈에서 제외한다.
   * 전체 소진일은 캘린더 화면에서 확인할 수 있다.
   */
  const upcomingDepletions = dashboard.calendar
    .filter(
      (item) =>
        item.expectedDepletionDate >= today &&
        item.expectedDepletionDate.startsWith(yearMonth)
    )
    .sort(
      (a, b) =>
        a.expectedDepletionDate.localeCompare(
          b.expectedDepletionDate
        )
    );

  const topDepletions = upcomingDepletions.slice(0, 3);

  // 하나라도 API 오류가 발생했는지 확인
  const hasErrors = Object.values(errors).some(Boolean);

  /**
   * 모든 홈 데이터를 다시 조회한다.
   */
  function handleRefresh() {
    setReloadKey((prev) => prev + 1);
  }

  return (
    <div className="home-page">

      {/* 홈 헤더 */}
      <header className="home-header">
        <div>
          <p className="home-header-label">
            나의 영양제 관리
          </p>

          <h1>오늘도 건강하게!</h1>

          <p className="home-header-date">
            {formatToday()}
          </p>
        </div>

        <div className="home-header-icon">
          <HeartPulse size={28} />
        </div>
      </header>

      <main className="home-content">

        {/* 홈 상단 통계 */}
        <section
          className="home-stats"
          aria-label="영양제 관리 요약"
        >

          {/* 등록 영양제 */}
          <Link
            to="/supplements"
            className="home-stat-card"
          >
            <Pill size={23} />

            <span>등록 영양제</span>

            <strong>
              {loading
                ? "..."
                : errors.supplements
                  ? "-"
                  : `${dashboard.supplements.length}개`}
            </strong>
          </Link>

          {/* 오늘 복용 */}
          <Link
            to="/intake"
            className="home-stat-card"
          >
            <SquareCheckBig size={23} />

            <span>오늘 복용</span>

            <strong>
              {loading
                ? "..."
                : errors.intakes
                  ? "-"
                  : `${checkedIntakes}/${totalIntakes}`}
            </strong>
          </Link>

          {/* 주문 추천 */}
          <Link
            to="/recommendations"
            className="home-stat-card"
          >
            <ShoppingCart size={23} />

            <span>주문 추천</span>

            <strong>
              {loading
                ? "..."
                : errors.recommendations
                  ? "-"
                  : `${recommendedSupplements.length}개`}
            </strong>
          </Link>

        </section>

        {/* 일부 API 실패 시 재조회 */}
        {!loading && hasErrors && (
          <div className="home-error" role="alert">
            <p>
              일부 정보를 불러오지 못했습니다.
            </p>

            <button
              type="button"
              onClick={handleRefresh}
            >
              <RefreshCw size={15} />
              다시 조회
            </button>
          </div>
        )}

        {/* 오늘 복용 현황 */}
        <section className="home-section">

          <div className="home-section-header">
            <h2>
              <SquareCheckBig size={20} />
              오늘 복용 현황
            </h2>

            <Link to="/intake">
              전체 보기
              <ChevronRight size={16} />
            </Link>
          </div>

          {loading ? (
            <p className="home-message">
              복용 현황을 불러오는 중입니다.
            </p>

          ) : errors.intakes ? (
            <p className="home-message home-error-text">
              {errors.intakes}
            </p>

          ) : (
            <>
              {/* 복용 완료 수와 진행률 */}
              <div className="home-progress-header">
                <strong>
                  {checkedIntakes}
                  <span> / {totalIntakes}개 완료</span>
                </strong>

                <span>{intakeProgress}%</span>
              </div>

              {/* 진행률 막대 */}
              <div
                className="home-progress-track"
                role="progressbar"
                aria-label="오늘 복용 완료율"
                aria-valuenow={intakeProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="home-progress-fill"
                  style={{
                    width: `${intakeProgress}%`,
                  }}
                />
              </div>

              {/* 오늘 복용 목록 미리보기 */}
              {dashboard.intakes.length === 0 ? (
                <p className="home-message">
                  오늘 복용할 영양제가 없습니다.
                </p>

              ) : (
                <div className="home-intake-list">
                  {dashboard.intakes
                    .slice(0, 3)
                    .map((item) => {

                      const checked =
                        item.status === "CHECKED";

                      return (
                        <Link
                          to="/intake"
                          className="home-intake-item"
                          key={item.supplementId}
                        >
                          {checked ? (
                            <CheckCircle2
                              size={21}
                              className="home-checked-icon"
                            />
                          ) : (
                            <Circle
                              size={21}
                              className="home-unchecked-icon"
                            />
                          )}

                          <span>{item.name}</span>

                          <small>
                            {item.dailyQuantity}정
                          </small>
                        </Link>
                      );
                    })}
                </div>
              )}

              {/* 복용 대상이 3개보다 많을 때 */}
              {dashboard.intakes.length > 3 && (
                <Link
                  to="/intake"
                  className="home-more-link"
                >
                  나머지 복용 목록 확인하기
                </Link>
              )}
            </>
          )}
        </section>

        {/* 이번 주문 추천 */}
        <section className="home-section">

          <div className="home-section-header">
            <h2>
              <ShoppingCart size={20} />
              이번 주문 추천
            </h2>

            <Link to="/recommendations">
              전체 보기
              <ChevronRight size={16} />
            </Link>
          </div>

          {loading ? (
            <p className="home-message">
              주문 추천 목록을 불러오는 중입니다.
            </p>

          ) : errors.recommendations ? (
            <p className="home-message home-error-text">
              {errors.recommendations}
            </p>

          ) : topRecommendations.length === 0 ? (
            <div className="home-empty">
              <CheckCircle2 size={25} />
              <p>
                현재 주문 추천 영양제가 없습니다.
              </p>
            </div>

          ) : (
            <div className="home-recommendation-list">
              {topRecommendations.map((item) => (
                <Link
                  to={`/supplements/${item.supplementId}`}
                  className="home-recommendation-item"
                  key={item.supplementId}
                >
                  <div className="home-recommendation-info">
                    <strong>
                      {item.supplementName}
                    </strong>

                    <span>
                      현재 재고 {item.currentStock}정
                    </span>
                  </div>

                  <span
                    className={`home-depletion-badge ${
                      getDepletionStatus(
                        item.daysUntilDepletion
                      )
                    }`}
                  >
                    {getDepletionText(
                      item.daysUntilDepletion
                    )}
                  </span>

                  <ChevronRight size={17} />
                </Link>
              ))}
            </div>
          )}

          {!loading &&
            !errors.recommendations &&
            recommendedSupplements.length > 3 && (
              <Link
                to="/recommendations"
                className="home-more-link"
              >
                나머지 추천 영양제 보기
              </Link>
            )}
        </section>

        {/* 다가오는 소진일 */}
        <section className="home-section">

          <div className="home-section-header">
            <h2>
              <CalendarDays size={20} />
              다가오는 소진일
            </h2>

            <Link to="/calendar">
              캘린더 보기
              <ChevronRight size={16} />
            </Link>
          </div>

          <p className="home-section-description">
            이번 달 남은 소진 예정 영양제
          </p>

          {loading ? (
            <p className="home-message">
              소진일을 불러오는 중입니다.
            </p>

          ) : errors.calendar ? (
            <p className="home-message home-error-text">
              {errors.calendar}
            </p>

          ) : topDepletions.length === 0 ? (
            <div className="home-empty">
              <CalendarDays size={25} />
              <p>
                이번 달 남은 소진 예정이 없습니다.
              </p>
            </div>

          ) : (
            <div className="home-calendar-list">
              {topDepletions.map((item) => (
                <Link
                  to={`/supplements/${item.supplementId}`}
                  className="home-calendar-item"
                  key={`${item.supplementId}-${item.expectedDepletionDate}`}
                >
                  <span className="home-calendar-date">
                    {formatDepletionDate(
                      item.expectedDepletionDate
                    )}
                  </span>

                  <strong>
                    {item.name}
                  </strong>

                  <ChevronRight size={17} />
                </Link>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default HomePage;
