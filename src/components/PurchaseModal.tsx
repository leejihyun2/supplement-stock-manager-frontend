import { useEffect, useState } from "react";
import type { FormEvent, MouseEvent } from "react";

import {
  X,
  CalendarDays,
  Package,
  Wallet,
  ShoppingCart,
} from "lucide-react";

import { createPurchase } from "../api/purchaseApi";
import type { PurchaseCreateRequest } from "../types/purchase";

import "./PurchaseModal.css";

// 부모 컴포넌트에서 전달받는 데이터와 함수
type PurchaseModalProps = {
  supplementId: number;
  supplementName: string;
  onClose: () => void;
  onSuccess: () => void;
};

// 현재 날짜를 yyyy-MM-dd 형식으로 반환
function getTodayDate(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function PurchaseModal({
  supplementId,
  supplementName,
  onClose,
  onSuccess,
}: PurchaseModalProps) {

  // 구매 등록 API 처리 상태
  const [submitting, setSubmitting] = useState(false);

  // 구매 등록 실패 메시지
  const [error, setError] = useState<string | null>(null);

  /**
   * 팝업 실행 중 배경 스크롤 방지
   * ESC 키를 누르면 팝업 닫기
   */
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, submitting]);

  // 팝업 바깥을 클릭하면 닫기
  function handleBackdropClick(
    event: MouseEvent<HTMLDivElement>
  ) {
    if (
      event.target === event.currentTarget &&
      !submitting
    ) {
      onClose();
    }
  }

  /**
   * 구매 등록 버튼 클릭
   *
   * 1. 입력값 추출
   * 2. Request DTO 생성
   * 3. POST API 호출
   * 4. 성공 시 부모 컴포넌트에 알림
   */
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) return;

    const formData = new FormData(event.currentTarget);

    const request: PurchaseCreateRequest = {
      purchaseDate: String(
        formData.get("purchaseDate") ?? ""
      ),

      purchaseQuantity: Number(
        formData.get("purchaseQuantity")
      ),

      purchasePrice: Number(
        formData.get("purchasePrice")
      ),

      purchaseSource: String(
        formData.get("purchaseSource") ?? ""
      ).trim(),
    };

    // 입력값 유효성 검사
    if (
      !request.purchaseDate ||
      !Number.isSafeInteger(request.purchaseQuantity) ||
      request.purchaseQuantity < 1 ||
      !Number.isSafeInteger(request.purchasePrice) ||
      request.purchasePrice < 1 ||
      !request.purchaseSource
    ) {
      setError("구매 정보를 올바르게 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Spring Boot 구매 등록 API 호출
      await createPurchase(supplementId, request);

      // 성공 시 부모 컴포넌트에 알림
      onSuccess();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "구매 등록 중 오류가 발생했습니다."
      );

    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="purchase-modal-backdrop"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        className="purchase-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-modal-title"
      >
        {/* 팝업 헤더 */}
        <div className="purchase-modal-header">
          <div>
            <h2 id="purchase-modal-title">
              구매 등록
            </h2>
            <p>{supplementName}</p>
          </div>

          <button
            type="button"
            className="purchase-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="팝업 닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 구매 정보 입력 폼 */}
        <form onSubmit={handleSubmit}>
          <div className="purchase-form">

            {/* 구매일자 */}
            <div className="purchase-field">
              <label htmlFor="purchaseDate">
                <CalendarDays size={18} />
                구매일자
              </label>

              <input
                id="purchaseDate"
                name="purchaseDate"
                type="date"
                defaultValue={getTodayDate()}
                required
              />
            </div>

            {/* 구매 수량 */}
            <div className="purchase-field">
              <label htmlFor="purchaseQuantity">
                <Package size={18} />
                구매 수량
              </label>

              <div className="purchase-input-unit">
                <input
                  id="purchaseQuantity"
                  name="purchaseQuantity"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue="1"
                  required
                />
                <span>통</span>
              </div>
            </div>

            {/* 구매 가격 */}
            <div className="purchase-field">
              <label htmlFor="purchasePrice">
                <Wallet size={18} />
                구매 가격
              </label>

              <div className="purchase-input-unit">
                <input
                  id="purchasePrice"
                  name="purchasePrice"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="가격 입력"
                  required
                />
                <span>원</span>
              </div>
            </div>

            {/* 구매처 */}
            <div className="purchase-field">
              <label htmlFor="purchaseSource">
                <ShoppingCart size={18} />
                구매처
              </label>

              <input
                id="purchaseSource"
                name="purchaseSource"
                type="text"
                placeholder="예: 아이허브"
                maxLength={100}
                required
              />
            </div>
          </div>

          {/* 오류 표시 */}
          {error && (
            <p className="purchase-error" role="alert">
              {error}
            </p>
          )}

          {/* 구매 등록 실행 */}
          <button
            type="submit"
            className="purchase-submit"
            disabled={submitting}
          >
            {submitting ? "등록 중..." : "등록"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PurchaseModal;
