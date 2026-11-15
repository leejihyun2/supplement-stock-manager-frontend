import { useEffect, useState } from "react";
import { Link } from "react-router";

import {
  ArrowLeft,
  Package,
  ChevronRight,
  ShoppingCart,
  House,
  SquareCheckBig,
  List,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import { getOrderRecommendations } from "../api/recommendationApi";
import type { RecommendationItem } from "../types/recommendation";

import "./RecommendationPage.css";

/**
 * 남은 일수에 따라 소진 상태 색상 결정
 *
 * 7일 이하: 빨간색
 * 8~14일: 주황색
 */
function getDepletionStatus(days: number): string {
  if (days <= 7) return "danger";
  return "warning";
}

/**
 * 남은 일수에 따른 문구
 */
function getDepletionText(days: number): string {
  if (days < 0) return "소진 예정일 경과";
  if (days === 0) return "오늘 소진";
  return `${days}일 후 소진`;
}

/**
 * 오늘 날짜를 한국어 형식으로 표시
 */
function formatToday(): string {
  return new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function RecommendationPage() {
  // 서버에서 조회한 추천 영양제
  const [recommendations, setRecommendations] =
    useState<RecommendationItem[]>([]);

  // 최초 조회 진행 상태
  const [loading, setLoading] = useState(true);

  // 조회 실패 시 오류 메시지
  const [error, setError] = useState<string | null>(null);

  // 재조회 버튼을 위한 상태
  const [reloadKey, setReloadKey] = useState(0);

  /**
   * 페이지에 처음 접근하거나 재조회 버튼을 누르면
   * Spring Boot 주문 추천 API를 호출한다.
   */
  useEffect(() => {
    const controller = new AbortController();

    async function loadRecommendations() {
      try {
        setLoading(true);
        setError(null);

        const data = await getOrderRecommendations(
          controller.signal
        );

        if (!controller.signal.aborted) {
          // 소진일까지 남은 일수가 적은 순서로 정렬
          // 주문 추천 여부는 백엔드 계산 결과를 그대로 사용
          const sorted = [...data].sort(
            (a, b) =>
              a.daysUntilDepletion - b.daysUntilDepletion
          );

          setRecommendations(sorted);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "주문 추천 목록을 불러오지 못했습니다."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadRecommendations();

    // 페이지 이동 시 진행 중인 요청 취소
    return () => controller.abort();
  }, [reloadKey]);

  return (
    <div className="recommendation-page">

      {/* 상단 헤더 */}
      <header className="recommendation-header">
        <Link
          to="/supplements"
          className="recommendation-back"
          aria-label="영양제 목록으로 돌아가기"
        >
          <ArrowLeft size={24} />
        </Link>

        <h1>이번 주문 추천</h1>
      </header>

      <main className="recommendation-content">

        {/* 기준일 안내 */}
        <section className="recommendation-info-banner">
          <div className="recommendation-banner-icon">
            <Package size={25} />
          </div>

          <div>
            <p className="recommendation-banner-title">
              기준일: {formatToday()}
            </p>

            <p className="recommendation-banner-subtitle">
              2주 이내 소진될 영양제를 미리 확인하세요!
            </p>
          </div>
        </section>

        {/* 주문 추천 카드 */}
        <section className="recommendation-list-card">

          {/* 카드 제목 */}
          <div className="recommendation-card-header">
            <div className="recommendation-title-row">
              <span className="recommendation-title-icon">
                <ShoppingCart size={22} />
              </span>

              <h2>이번 주문 추천</h2>
            </div>

            {!loading && !error && (
              <span className="recommendation-count">
                {recommendations.length}개
              </span>
            )}
          </div>

          {/* API 조회 중 */}
          {loading ? (
            <p className="recommendation-message">
              주문 추천 목록을 불러오는 중입니다.
            </p>
          ) : error ? (
            // API 오류
            <div
              className="recommendation-error"
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
          ) : recommendations.length === 0 ? (
            // 추천할 영양제가 없는 경우
            <div className="recommendation-empty">
              <CheckCircle2 size={29} />

              <strong>
                현재 주문 추천 영양제가 없습니다.
              </strong>

              <p>
                14일 이내 소진 예정인 영양제가 없어요.
              </p>
            </div>
          ) : (
            // 백엔드에서 반환한 추천 목록
            <div className="recommendation-items">
              {recommendations.map((item) => (
                <Link
                  to={`/supplements/${item.supplementId}`}
                  className="recommendation-item"
                  key={item.supplementId}
                >
                  {/* 영양제 이름과 재고 */}
                  <div className="recommendation-item-info">
                    <strong>{item.supplementName}</strong>

                    <span>
                      현재 재고: {item.currentStock}정
                    </span>
                  </div>

                  {/* 남은 소진일 */}
                  <div className="recommendation-item-right">
                    <span
                      className={`recommendation-badge ${
                        getDepletionStatus(
                          item.daysUntilDepletion
                        )
                      }`}
                    >
                      {getDepletionText(
                        item.daysUntilDepletion
                      )}
                    </span>

                    <ChevronRight size={18} />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* 하단 안내 */}
          {!loading && !error &&
            recommendations.length > 0 && (
              <p className="recommendation-footer-note">
                추천된 영양제를 선택하면 상세 정보를
                확인할 수 있습니다.
              </p>
            )}
        </section>
      </main>

  
    </div>
  );
}

export default RecommendationPage;