import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

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
  restockSupplement,
} from "../api/supplementApi";

import PurchaseModal from "../components/PurchaseModal";
import type { SupplementDetail } from "../types/supplement";

import "./SupplementDetailPage.css";

// 예상 소진일 날짜 형식 변환
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

// 구매 가격 표시
function formatPrice(price: number | null): string {
  if (price == null) return "미등록";
  return `${price.toLocaleString("ko-KR")}원`;
}

// 섭취 일정 표시
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

/**
 * URL에서 영양제 ID를 가져오는 컴포넌트
 */
function SupplementDetailPage() {
  const { id } = useParams();
  const supplementId = Number(id);

  // 유효하지 않은 ID 처리
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

/**
 * 상세 조회 및 기능 처리 컴포넌트
 */
function SupplementDetailContent({
  supplementId,
}: {
  supplementId: number;
}) {
  const navigate = useNavigate();

  // 영양제 상세 정보
  const [supplement, setSupplement] =
    useState<SupplementDetail | null>(null);

  // 조회 상태
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // API 요청 처리 상태
  const [restocking, setRestocking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 구매 등록 팝업 표시 여부
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  // 최초 조회 오류와 기능 실행 결과
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] =
    useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // 공통 작업 처리 상태
  const busy = restocking || deleting || refreshing;

  /**
   * 상세 화면에 진입하면 백엔드 API 호출
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
              : "영양제 상세 조회에 실패했습니다."
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
   * 구매 등록 또는 새 통 시작 후 상세 정보 재조회
   *
   * 재고·미개봉 통 수·예상 소진일을 최신 상태로 갱신
   */
  async function refreshDetail() {
    try {
      setRefreshing(true);

      const updated = await getSupplementDetail(supplementId);

      setSupplement(updated);
    } catch {
      // 앞선 구매/새 통 시작은 성공했을 수 있음
      setActionError(
        "작업은 완료되었지만 최신 정보 조회에 실패했습니다."
      );
    } finally {
      setRefreshing(false);
    }
  }

  /**
   * 구매 등록 버튼 클릭
   */
  function handleOpenPurchase() {
    if (busy) return;

    setNotice(null);
    setActionError(null);

    setPurchaseOpen(true);
  }

  /**
   * 구매 등록 완료
   *
   * PurchaseModal에서 구매 API가 성공한 경우 실행
   */
  function handlePurchaseSuccess() {
    // 팝업 닫기
    setPurchaseOpen(false);

    // 작업 결과 표시
    setNotice("구매 등록이 완료되었습니다.");
    setActionError(null);

    // 서버의 최신 데이터 조회
    void refreshDetail();
  }

  /**
   * 새 통 시작
   *
   * 1. 미개봉 수량 확인
   * 2. 사용자 확인
   * 3. 새 통 시작 API 호출
   * 4. 최신 재고 재조회
   */
  async function handleRestock() {
    if (!supplement || busy || purchaseOpen) return;

    setNotice(null);
    setActionError(null);

    // 미개봉 통이 없는 경우
    if (supplement.unopenedBottleCount <= 0) {
      setActionError(
        "미개봉 영양제가 없어 새 통을 시작할 수 없습니다."
      );
      return;
    }

    // 작업 실행 전 확인
    const confirmed = window.confirm(
      `"${supplement.supplementName}"의 새 통을 시작하시겠습니까?\n미개봉 수량이 1통 감소하고 현재 재고가 갱신됩니다.`
    );

    if (!confirmed) return;

    try {
      setRestocking(true);

      // Spring Boot 새 통 시작 API 호출
      await restockSupplement(supplementId);

      setNotice("새 통 시작이 완료되었습니다.");

      // 변경된 재고를 다시 조회
      await refreshDetail();

    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "새 통 시작에 실패했습니다."
      );
    } finally {
      setRestocking(false);
    }
  }

  /**
   * 기존 영양제 삭제 기능
   */
  async function handleDelete() {
    if (!supplement || busy || purchaseOpen) return;

    const confirmed = window.confirm(
      `"${supplement.supplementName}"을(를) 삭제하시겠습니까?\n삭제한 영양제는 복구할 수 없습니다.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setNotice(null);
      setActionError(null);

      await deleteSupplement(supplementId);

      // 삭제 성공 후 목록으로 이동
      navigate("/supplements", { replace: true });

    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "영양제 삭제에 실패했습니다."
      );
    } finally {
      setDeleting(false);
    }
  }

  // 백엔드 주문 추천 여부
  const recommendation =
    supplement?.includedInCurrentRecommendation ??
    supplement?.includedInCurrentRecommendaion;

  return (
    <div className="detail-shell">

      {/* 상단 헤더 */}
      <header className="detail-header">
        <Link
          to="/"
          className="detail-back"
          aria-label="홈으로 돌아가기"
        >
          <ArrowLeft size={24} />
        </Link>

        <h1>영양제 상세</h1>
      </header>

      <main className="detail-content">
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
            {/* 상세 정보 카드 */}
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

              {/* 소진 예정 및 주문 추천 */}
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

            {/* API 작업 결과 */}
            {notice && (
              <p className="detail-action-notice" role="status">
                {notice}
              </p>
            )}

            {actionError && (
              <div className="detail-action-error" role="alert">
                <p>{actionError}</p>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setActionError(null);
                    void refreshDetail();
                  }}
                >
                  다시 조회
                </button>
              </div>
            )}

            {refreshing && (
              <p className="detail-refreshing">
                최신 정보를 불러오는 중입니다.
              </p>
            )}

            {/* 기능 버튼 */}
            <section className="detail-actions">
              <div className="detail-action-grid">

                {/* 정보 수정 */}
                <Link
                  to={`/supplements/${supplementId}/edit`}
                  className="detail-edit-link"
                  aria-disabled={busy}
                  onClick={(event) => {
                    if (busy) event.preventDefault();
                  }}
                >
                  <Pencil size={17} />
                  정보 수정
                </Link>

                {/* 새 통 시작 */}
                <button
                  type="button"
                  onClick={handleRestock}
                  disabled={
                    busy ||
                    supplement.unopenedBottleCount <= 0
                  }
                  title={
                    supplement.unopenedBottleCount <= 0
                      ? "미개봉 통이 없습니다."
                      : "새 통 시작"
                  }
                >
                  <RefreshCw size={17} />
                  {restocking ? "처리 중..." : "새 통 시작"}
                </button>

                {/* 구매 등록 팝업 */}
                <button
                  type="button"
                  className="detail-purchase-button"
                  onClick={handleOpenPurchase}
                  disabled={busy}
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
                disabled={busy}
              >
                <Trash2 size={17} />
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </section>
          </>
        )}
      </main>

      {/* 구매 등록 팝업 표시 */}
      {purchaseOpen && supplement && (
        <PurchaseModal
          supplementId={supplementId}
          supplementName={supplement.supplementName}
          onClose={() => setPurchaseOpen(false)}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
}

export default SupplementDetailPage;
