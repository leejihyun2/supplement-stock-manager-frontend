import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  House,
  SquareCheckBig,
  List,
  RefreshCw,
} from "lucide-react";

import { getDepletionCalendar } from "../api/depletionCalendarApi";
import type { DepletionCalendarItem } from "../types/depletionCalendar";

import "./CalendarPage.css";

// 달력의 요일
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 영양제 소진 예정일을 구분할 색상
const EVENT_COLORS = [
  "#ef4444", // 빨강
  "#f59e0b", // 주황
  "#3b82f6", // 파랑
  "#22c55e", // 초록
  "#8b5cf6", // 보라
];

// 숫자를 두 자리로 변환
function pad(number: number): string {
  return String(number).padStart(2, "0");
}

// 날짜를 yyyy-MM-dd 형식으로 변환
function toDateKey(date: Date): string {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
}

// 영양제 ID에 따라 점 색상을 결정
function getEventColor(supplementId: number): string {
  return EVENT_COLORS[
    (supplementId - 1) % EVENT_COLORS.length
  ];
}

// 날짜를 한국어로 표시
function formatSelectedDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

/**
 * 소진일 캘린더 페이지
 */
function CalendarPage() {

  // 현재 화면에 표시할 연도와 월
  const [displayMonth, setDisplayMonth] = useState<Date>(
    () => {
      const today = new Date();

      return new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
    }
  );

  // 사용자가 선택한 날짜
  const [selectedDate, setSelectedDate] = useState<string>(
    () => toDateKey(new Date())
  );

  // 백엔드에서 조회한 소진 예정 영양제
  const [depletions, setDepletions] =
    useState<DepletionCalendarItem[]>([]);

  // API 요청 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API 재조회용
  const [reloadKey, setReloadKey] = useState(0);

  // 화면에 표시할 연월: yyyy-MM
  const yearMonth = [
    displayMonth.getFullYear(),
    pad(displayMonth.getMonth() + 1),
  ].join("-");

  // 오늘 날짜
  const todayKey = toDateKey(new Date());

  /**
   * 화면에 표시할 월이 바뀌면
   * 해당 월의 소진일 캘린더 API를 호출한다.
   */
  useEffect(() => {
    const controller = new AbortController();

    async function loadCalendar() {
      try {
        setLoading(true);
        setError(null);
        setDepletions([]);

        // 월별 소진일 조회 API
        const data = await getDepletionCalendar(
          yearMonth,
          controller.signal
        );

        if (!controller.signal.aborted) {
          setDepletions(data);
        }

      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "소진일 캘린더 조회에 실패했습니다."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCalendar();

    // 월 이동 또는 페이지 종료 시 이전 요청 취소
    return () => controller.abort();

  }, [yearMonth, reloadKey]);

  /**
   * 날짜별 소진 예정 영양제를 묶는다.
   *
   * 예:
   * 2026-11-18 -> [락토페린, 비타민C]
   * 2026-11-21 -> [밀크씨슬]
   */
  const depletionByDate = useMemo(() => {
    const result = new Map<
      string,
      DepletionCalendarItem[]
    >();

    for (const item of depletions) {
      const date = item.expectedDepletionDate;

      const existing = result.get(date) ?? [];

      existing.push(item);

      result.set(date, existing);
    }

    return result;
  }, [depletions]);

  /**
   * 달력에 표시할 날짜들을 생성한다.
   *
   * 예를 들어 월의 첫날이 수요일이라면
   * 이전 달의 일~화요일도 함께 표시한다.
   */
  const calendarDays = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();

    // 해당 월 1일의 요일
    const firstDayOfWeek = new Date(
      year,
      month,
      1
    ).getDay();

    // 해당 월의 마지막 날짜
    const lastDay = new Date(
      year,
      month + 1,
      0
    ).getDate();

    // 달력에 필요한 전체 칸 수
    const cellCount =
      Math.ceil((firstDayOfWeek + lastDay) / 7) * 7;

    return Array.from(
      { length: cellCount },
      (_, index) => {

        // 이전 달·현재 달·다음 달 날짜 계산
        const date = new Date(
          year,
          month,
          index - firstDayOfWeek + 1
        );

        return {
          date,
          key: toDateKey(date),
          day: date.getDate(),

          // 현재 화면의 월에 속하는지 확인
          isCurrentMonth:
            date.getMonth() === month &&
            date.getFullYear() === year,
        };
      }
    );
  }, [displayMonth]);

  /**
   * 이전 달 또는 다음 달로 이동
   *
   * direction = -1 : 이전 달
   * direction = 1  : 다음 달
   */
  function changeMonth(direction: number) {
    const nextMonth = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth() + direction,
      1
    );

    setDisplayMonth(nextMonth);

    // 현재 달이면 오늘 날짜 선택
    // 다른 달이면 1일을 기본 선택
    const today = new Date();

    const isThisMonth =
      today.getFullYear() === nextMonth.getFullYear() &&
      today.getMonth() === nextMonth.getMonth();

    setSelectedDate(
      isThisMonth
        ? toDateKey(today)
        : toDateKey(nextMonth)
    );
  }

  /**
   * 사용자가 달력 날짜를 클릭했을 때
   */
  function handleDateClick(date: Date) {

    // 클릭한 날짜를 선택 상태로 저장
    setSelectedDate(toDateKey(date));

    // 이전 달 또는 다음 달 날짜를 클릭했다면
    // 해당 월로 이동한다.
    if (
      date.getMonth() !== displayMonth.getMonth() ||
      date.getFullYear() !== displayMonth.getFullYear()
    ) {
      setDisplayMonth(
        new Date(
          date.getFullYear(),
          date.getMonth(),
          1
        )
      );
    }
  }

  // 현재 선택한 날짜의 소진 예정 영양제
  const selectedDepletions = [
    ...(depletionByDate.get(selectedDate) ?? []),
  ].sort((a, b) => a.name.localeCompare(b.name, "ko"));

  return (
    <div className="calendar-page">

      {/* 상단 헤더 */}
      <header className="calendar-header">
        <Link
          to="/supplements"
          className="calendar-back"
          aria-label="영양제 목록으로 돌아가기"
        >
          <ArrowLeft size={24} />
        </Link>

        <h1>소진일 캘린더</h1>
      </header>

      <main className="calendar-content">

        {/* 월 선택 */}
        <section className="calendar-month-selector">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="이전 달"
          >
            <ChevronLeft size={22} />
          </button>

          <h2>
            {displayMonth.getFullYear()}년{" "}
            {displayMonth.getMonth() + 1}월
          </h2>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="다음 달"
          >
            <ChevronRight size={22} />
          </button>
        </section>

        {/* 달력 */}
        <section
          className="calendar-panel"
          aria-label={`${yearMonth} 소진일 달력`}
        >
          {/* 요일 표시 */}
          <div className="calendar-weekdays">
            {WEEKDAYS.map((weekday, index) => (
              <div
                key={weekday}
                className={
                  index === 0
                    ? "sunday"
                    : index === 6
                      ? "saturday"
                      : ""
                }
              >
                {weekday}
              </div>
            ))}
          </div>

          {/* 날짜 표시 */}
          <div className="calendar-grid">
            {calendarDays.map((day) => {

              // 해당 날짜의 소진 예정 영양제
              const events =
                depletionByDate.get(day.key) ?? [];

              const selected =
                selectedDate === day.key;

              const today =
                todayKey === day.key;

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() =>
                    handleDateClick(day.date)
                  }
                  aria-pressed={selected}
                  aria-label={`${day.key}, 소진 예정 ${events.length}개`}
                  className={[
                    "calendar-day",
                    day.isCurrentMonth
                      ? ""
                      : "other-month",
                    selected ? "selected" : "",
                    today ? "today" : "",
                  ].filter(Boolean).join(" ")}
                >
                  {/* 날짜 숫자 */}
                  <span className="calendar-day-number">
                    {day.day}
                  </span>

                  {/* 소진 예정 표시 점 */}
                  <div
                    className="calendar-event-dots"
                    aria-hidden="true"
                  >
                    {day.isCurrentMonth &&
                      events.slice(0, 3).map((item) => (
                        <span
                          key={item.supplementId}
                          className="calendar-event-dot"
                          style={{
                            backgroundColor: getEventColor(
                              item.supplementId
                            ),
                          }}
                        />
                      ))}

                    {/* 같은 날 4개 이상이면 추가 개수 표시 */}
                    {day.isCurrentMonth &&
                      events.length > 3 && (
                        <span className="calendar-extra-events">
                          +{events.length - 3}
                        </span>
                      )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 선택한 날짜의 소진 예정 목록 */}
        <section className="calendar-depletion-card">

          <div className="calendar-depletion-header">
            <div>
              <CalendarDays size={19} />
              <h3>{formatSelectedDate(selectedDate)}</h3>
            </div>

            {!loading && !error && (
              <span>{selectedDepletions.length}개</span>
            )}
          </div>

          {/* API 로딩 */}
          {loading ? (
            <p className="calendar-message">
              소진 예정일을 불러오는 중입니다.
            </p>

          ) : error ? (
            /* API 오류 */
            <div
              className="calendar-error"
              role="alert"
            >
              <p>{error}</p>

              <button
                type="button"
                onClick={() =>
                  setReloadKey((prev) => prev + 1)
                }
              >
                <RefreshCw size={15} />
                다시 조회
              </button>
            </div>

          ) : selectedDepletions.length === 0 ? (
            /* 선택한 날짜에 소진 예정 영양제가 없는 경우 */
            <p className="calendar-message">
              선택한 날짜에 소진 예정인 영양제가 없습니다.
            </p>

          ) : (
            /* 선택한 날짜의 영양제 목록 */
            <div className="calendar-depletion-list">
              {selectedDepletions.map((item) => (
                <Link
                  key={item.supplementId}
                  to={`/supplements/${item.supplementId}`}
                  className="calendar-depletion-item"
                >
                  <span
                    className="calendar-item-dot"
                    style={{
                      backgroundColor: getEventColor(
                        item.supplementId
                      ),
                    }}
                  />

                  <div className="calendar-item-info">
                    <strong>{item.name}</strong>
                    <span>소진 예정</span>
                  </div>

                  <ChevronRight size={19} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <p className="calendar-footer-note">
          소진 예정일은 현재 재고와 복용량을 기준으로
          계산됩니다.
        </p>
      </main>

    
    </div>
  );
}

export default CalendarPage;
