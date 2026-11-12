
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";

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

import {
  getSupplementDetail,
  deleteSupplement,
} from "../api/supplementApi";

import type { SupplementDetail } from "../types/supplement";
import "./SupplementDetailPage.css";

// 예상 소진일 표시 형식 변환
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

// 최근 구매 가격 표시
function formatPrice(price: number | null): string {
  if (price == null) return "미등록";
  return `${price.toLocaleString("ko-KR")}원`;
}

// 섭취 요일 표시
function formatSchedule(
  schedule: string | string[]
): string {
  if (Array.isArray(schedule)) {
    return schedule.length > 0
      ? schedule.join(", ")
      : "미설정";
  }

  return schedule || "미설정";
}

function SupplementDetailPage() {
  // URL에서 영양제 ID 조회
  const { id } = useParams();
  const supplementId = Number(id);

  // 잘못된 ID 처리
  if (
    !id ||
    !Number.isSafeInteger(supplementId) ||
    supplementId <= 0
  ) {
    return (
      <div className="detail-shell">
        <main className="detail-content">
          <p>올바르지 않은 영양제 ID입니다.</p>
          <Link to="/supplements">
            목록으로 돌아가기
          </Link>
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

function SupplementDetailContent({
  supplementId,
}: {
  supplementId: number;
}) {
  const navigate = useNavigate();

  // 기존 상세 조회 데이터
  const [supplement, setSupplement] =
    useState<SupplementDetail | null>(null);

  // 상세 조회 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 삭제 상태
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] =
    useState<string | null>(null);

  /**
   * 영양제 상세 조회
   *
   * GET /supplements/{supplementId}
   */
  useEffect(() => {
    const controller = new AbortController();

    async function loadDetail() {
      try {
        setLoading(true);
        setError(null);

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

    return () => controller.abort();
  }, [supplementId]);

  /**
   * 영양제 삭제
   *
   * 1. 삭제 확인창 표시
   * 2. 사용자가 확인하면 DELETE API 호출
   * 3. 성공하면 영양제 목록으로 이동
   */
  async function handleDelete() {
    if (!supplement || deleting) return;

    // 삭제 전 사용자에게 한 번 더 확인
    const confirmed = window.confirm(
      `"${supplement.supplementName}"을(를) 삭제하시겠습니까?\n삭제한 영양제는 복구할 수 없습니다.`
    );

    // 취소 버튼을 누르면 삭제하지 않음
    if (!confirmed) return;

    try {
      setDeleting(true);
      setDeleteError(null);

      // Spring Boot 삭제 API 호출
      await deleteSupplement(supplementId);

      // 삭제 성공 시 목록으로 이동
      navigate("/supplements", {
        replace: true,
      });
    } catch (err) {
      // 삭제 실패 시 현재 화면 유지
      setDeleteError(
        err instanceof Error
          ? err.message
          : "영양제 삭제 중 오류가 발생했습니다."
      );
    } finally {
      setDeleting(false);
    }
  }

  // 백엔드의 주문 추천 여부
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
          aria-label="목록으로 돌아가기"
        >
          <ArrowLeft size={24} />
        </Link>

        <h1>영양제 상세</h1>
      </header>

      <main className="detail-content">

        {/* 로딩 및 오류 */}
        {loading ? (
          <p className="detail-message">
            영양제 정보를 불러오는 중입니다.
          </p>

        ) : error ? (
          <div className="detail-message" role="alert">
            <p>{error}</p>
            <Link to="/supplements">
              목록으로 돌아가기
            </Link>
          </div>

        ) : !supplement ? (
          <p className="detail-message">
            영양제 정보가 없습니다.
          </p>

        ) : (
          <>
            {/* 영양제 상세 정보 */}
            <section className="detail-card">

              {/* 영양제 이름 */}
              <div className="detail-product">
                <div className="detail-product-icon">
                  <Pill size={28} />
                </div>

                <div>
                  <h2>{supplement.supplementName}</h2>
                  <span className="detail-schedule">
                    섭취일: {formatSchedule(
                      supplement.intakeSchedule
                    )}
                  </span>
                </div>
              </div>

              {/* 재고 및 복용 정보 */}
              <div className="detail-stats">
                <div className="detail-stat">
                  <Package size={17} />
                  <span>총 개수</span>
                  <strong>
                    {supplement.totalQuantity}개
                  </strong>
                </div>

                <div className="detail-stat">
                  <Pill size={17} />
                  <span>1회 섭취량</span>
                  <strong>
                    {supplement.servingSize}개
                  </strong>
                </div>

                <div className="detail-stat">
                  <CalendarDays size={17} />
                  <span>하루 섭취 횟수</span>
                  <strong>
                    {supplement.servingsPerDay}회
                  </strong>
                </div>

                <div className="detail-stat">
                  <Package size={17} />
                  <span>미개봉 수량</span>
                  <strong>
                    {supplement.unopenedBottleCount}통
                  </strong>
                </div>

                <div className="detail-stat">
                  <Layers size={17} />
                  <span>현재 개수</span>
                  <strong>
                    {supplement.currentStock}개
                  </strong>
                </div>
              </div>

              {/* 소진 정보 */}
              <div className="detail-depletion">
                <div className="detail-data-row">
                  <span>
                    <CalendarDays size={17} />
                    예상 소진일
                  </span>

                  <strong className="detail-green">
                    {formatDate(
                      supplement.expectedDepletionDate
                    )}
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

              {/* 최근 구매 정보 */}
              <div className="detail-purchase">
                <div className="detail-data-row">
                  <span>최근 구매 가격</span>
                  <strong>
                    {formatPrice(supplement.purchasePrice)}
                  </strong>
                </div>

                <div className="detail-data-row">
                  <span>구매처</span>
                  <strong>
                    {supplement.purchaseSource ?? "미등록"}
                  </strong>
                </div>
              </div>
            </section>

            {/* 기능 버튼 */}
            <section className="detail-actions">

              <div className="detail-action-grid">

                {/* 정보 수정 화면으로 이동 */}
                <Link
                  to={`/supplements/${supplementId}/edit`}
                  className="detail-edit-link"
                >
                  <Pencil size={17} />
                  정보 수정
                </Link>

                {/* 새 통 시작 - 이후 구현 */}
                <button
                  type="button"
                  disabled
                  title="추후 구현"
                >
                  <RefreshCw size={17} />
                  새 통 시작
                </button>

                {/* 구매 등록 - 이후 구현 */}
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

              {/* 영양제 삭제 */}
              <button
                type="button"
                className="detail-delete-button"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 size={17} />

                {deleting
                  ? "삭제 중..."
                  : "삭제"}
              </button>

              {/* 삭제 실패 메시지 */}
              {deleteError && (
                <p
                  className="detail-delete-error"
                  role="alert"
                >
                  {deleteError}
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default SupplementDetailPage;
