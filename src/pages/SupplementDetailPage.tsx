
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import {
  ArrowLeft,
  Pill,
  Package,
  CalendarDays,
  Clock3,
  Layers,
  ShoppingCart,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { getSupplementDetail } from "../api/supplementApi";
import type { SupplementDetail } from "../types/supplement";
import "./SupplementDetailPage.css";

// 예상 소진일을 한국어 날짜 형식으로 변환
function formatDate(value: string | null): string {
  if (!value) return "정보 없음";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

// 구매 가격을 원화로 표시
function formatPrice(price: number | null): string {
  if (price === null || price === undefined) {
    return "미등록";
  }

  return `${price.toLocaleString("ko-KR")}원`;
}

// 복용 요일을 문자열로 표시
function formatSchedule(schedule: string | string[]): string {
  if (Array.isArray(schedule)) {
    return schedule.length > 0 ? schedule.join(", ") : "미설정";
  }

  return schedule || "미설정";
}

// URL에서 영양제 ID를 가져오는 페이지
function SupplementDetailPage() {
  const { id } = useParams();

  const supplementId = Number(id);

  // 잘못된 ID로 접근하는 경우
  if (
    !id ||
    !Number.isSafeInteger(supplementId) ||
    supplementId <= 0
  ) {
    return (
      <div className="detail-shell">
        <main className="detail-content">
          <p>올바르지 않은 영양제 ID입니다.</p>
          <Link to="/supplements">목록으로 돌아가기</Link>
        </main>
      </div>
    );
  }

  return (
    <SupplementDetailContent
      key={supplementId}
      supplementId={supplementId}
    />
  );
}

// 실제 상세 데이터 조회 및 화면 표시
function SupplementDetailContent({
  supplementId,
}: {
  supplementId: number;
}) {
  // 조회된 영양제 상세 데이터
  const [supplement, setSupplement] =
    useState<SupplementDetail | null>(null);

  // API 호출 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    // 영양제 상세 조회 API 호출
    async function loadDetail() {
      try {
        const data = await getSupplementDetail(
          supplementId,
          controller.signal
        );

        if (!controller.signal.aborted) {
          setSupplement(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "상세 조회 중 오류가 발생했습니다."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    // 컴포넌트 종료 시 API 요청 취소
    return () => controller.abort();
  }, [supplementId]);

  // 상세 조회 완료 여부
  const recommendation =
    supplement?.includedInCurrentRecommendation ??
    supplement?.includedInCurrentRecommendaion;

  return (
    <div className="detail-shell">
      {/* 상단 헤더 */}
      <header className="detail-header">
        <Link
          to="/supplements"
          className="detail-back"
          aria-label="영양제 목록으로 돌아가기"
        >
          <ArrowLeft size={24} />
        </Link>
        <h1>영양제 상세</h1>
      </header>

      <main className="detail-content">
        {/* 로딩 및 오류 처리 */}
        {loading ? (
          <p className="detail-message">
            영양제 정보를 불러오는 중입니다.
          </p>
        ) : error ? (
          <div className="detail-message" role="alert">
            <p>{error}</p>
            <Link to="/supplements">목록으로 돌아가기</Link>
          </div>
        ) : !supplement ? (
          <p className="detail-message">
            영양제 정보가 없습니다.
          </p>
        ) : (
          <>
            {/* 영양제 정보 카드 */}
            <section className="detail-card">
              {/* 이름 및 복용 요일 */}
              <div className="detail-product">
                <div className="detail-product-icon">
                  <Pill size={28} />
                </div>

                <div>
                  <h2>{supplement.supplementName}</h2>
                  <span className="detail-schedule">
                    섭취일: {formatSchedule(supplement.intakeSchedule)}
                  </span>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="detail-stats">
                <div className="detail-stat">
                  <Package size={17} />
                  <span>총 개수</span>
                  <strong>{supplement.totalQuantity}개</strong>
                </div>

                <div className="detail-stat">
                  <Pill size={17} />
                  <span>1회 섭취량</span>
                  <strong>{supplement.servingSize}개</strong>
                </div>

                <div className="detail-stat">
                  <CalendarDays size={17} />
                  <span>하루 섭취 횟수</span>
                  <strong>{supplement.servingsPerDay}회</strong>
                </div>

                <div className="detail-stat">
                  <Package size={17} />
                  <span>미개봉 수량</span>
                  <strong>{supplement.unopenedBottleCount}통</strong>
                </div>

                <div className="detail-stat">
                  <Layers size={17} />
                  <span>현재 개수</span>
                  <strong>{supplement.currentStock}개</strong>
                </div>
              </div>

              {/* 소진 예정 정보 */}
              <div className="detail-depletion">
                <div className="detail-data-row">
                  <span>
                    <CalendarDays size={17} />
                    예상 소진일
                  </span>
                  <strong className="detail-green">
                    {formatDate(supplement.expectedDepletionDate)}
                  </strong>
                </div>

                <div className="detail-data-row">
                  <span>
                    <Clock3 size={17} />
                    소진까지
                  </span>

                  <strong
                    className={
                      supplement.daysUntilDepletion <= 14
                        ? "detail-warning"
                        : "detail-green"
                    }
                  >
                    {supplement.daysUntilDepletion}일
                  </strong>
                </div>

                <div className="detail-data-row">
                  <span>
                    <ShoppingCart size={17} />
                    이번 주문 추천
                  </span>

                  <strong>
                    {recommendation === undefined
                      ? "정보 없음"
                      : recommendation
                        ? "포함"
                        : "제외"}
                  </strong>
                </div>
              </div>

              {/* 구매 정보 */}
              <div className="detail-purchase">
                <div className="detail-data-row">
                  <span>최근 구매 가격</span>
                  <strong>{formatPrice(supplement.purchasePrice)}</strong>
                </div>

                <div className="detail-data-row">
                  <span>구매처</span>
                  <strong>{supplement.purchaseSource ?? "미등록"}</strong>
                </div>
              </div>
            </section>

            {/* 다음 기능에서 API를 연결할 버튼 */}
            <section className="detail-actions">
              <div className="detail-action-grid">
                <button type="button" disabled title="추후 구현">
                  <Pencil size={17} />
                  정보 수정
                </button>

                <button type="button" disabled title="추후 구현">
                  <RefreshCw size={17} />
                  새 통 시작
                </button>

                <button
                  type="button"
                  className="detail-purchase-button"
                  disabled
                  title="추후 구현"
                >
                  <ShoppingCart size={17} />
                  구매 등록
                </button>
              </div>

              <button
                type="button"
                className="detail-delete-button"
                disabled
                title="추후 구현"
              >
                <Trash2 size={17} />
                삭제
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default SupplementDetailPage;
