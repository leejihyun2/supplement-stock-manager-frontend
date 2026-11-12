import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";

import {
  ArrowLeft,
  Pill,
  Package,
  Layers,
  LockKeyhole,
  CalendarDays,
  Clock3,
} from "lucide-react";

import { createSupplement } from "../api/supplementApi";
import type { SupplementCreateRequest } from "../types/supplement";

import "./SupplementCreatePage.css";

function SupplementCreatePage() {
  // 등록 성공 후 목록 화면으로 이동하기 위해 사용
  const navigate = useNavigate();

  // 등록 요청 진행 상태
  const [loading, setLoading] = useState(false);

  // 등록 실패 시 오류 메시지 저장
  const [error, setError] = useState<string | null>(null);

  /**
   * 등록하기 버튼 클릭 시 실행
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // HTML form 기본 제출 동작 방지
    event.preventDefault();

    // 현재 입력된 폼 데이터 가져오기
    const formData = new FormData(event.currentTarget);

    // 백엔드 DTO 형식에 맞게 데이터 구성
    const request: SupplementCreateRequest = {
      supplementName: String(
        formData.get("supplementName") ?? ""
      ).trim(),

      totalQuantity: Number(formData.get("totalQuantity")),
      currentStock: Number(formData.get("currentStock")),
      unopenedBottleCount: Number(
        formData.get("unopenedBottleCount")
      ),
      servingSize: Number(formData.get("servingSize")),
      servingsPerDay: Number(formData.get("servingsPerDay")),

      intakeSchedule: String(
        formData.get("intakeSchedule") ?? ""
      ).trim(),
    };

    // 현재 재고가 한 통의 총 수량보다 클 수 없음
    if (request.currentStock > request.totalQuantity) {
      setError("현재 재고는 1통당 총 수량을 초과할 수 없습니다.");
      return;
    }

    // 등록 API 호출
    try {
      setLoading(true);
      setError(null);

      await createSupplement(request);

      // 등록 성공 → 영양제 목록으로 이동
      navigate("/supplements");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "영양제 등록 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-page">
      {/* 상단 헤더 */}
      <header className="create-header">
        <Link
          to="/supplements"
          className="create-back"
          aria-label="영양제 목록으로 돌아가기"
        >
          <ArrowLeft size={24} />
        </Link>

        <h1>영양제 등록</h1>
      </header>

      <main className="create-content">
        {/* 화면 안내 */}
        <div className="create-intro">
          <div className="create-intro-icon">
            <Pill size={28} />
          </div>

          <div>
            <h2>영양제를 등록해주세요</h2>
            <p>보유한 영양제의 정보를 입력해주세요.</p>
          </div>
        </div>

        {/* 영양제 등록 폼 */}
        <form onSubmit={handleSubmit}>
          <section className="create-form-card">

            {/* 영양제 이름 */}
            <div className="create-field">
              <label htmlFor="supplementName">
                <Pill size={18} />
                <span>영양제 이름 <b>*</b></span>
              </label>

              <input
                id="supplementName"
                name="supplementName"
                type="text"
                placeholder="예: 마그오7"
                maxLength={100}
                required
              />
            </div>

            {/* 총 수량 */}
            <div className="create-field">
              <label htmlFor="totalQuantity">
                <Package size={18} />
                <span>총 개수 <b>*</b></span>
              </label>

              <div className="create-input-unit">
                <input
                  id="totalQuantity"
                  name="totalQuantity"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="예: 180"
                  required
                />
                <span>개</span>
              </div>
            </div>

            {/* 현재 재고 */}
            <div className="create-field">
              <label htmlFor="currentStock">
                <Layers size={18} />
                <span>현재 개수 <b>*</b></span>
              </label>

              <div className="create-input-unit">
                <input
                  id="currentStock"
                  name="currentStock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="예: 180"
                  required
                />
                <span>개</span>
              </div>
            </div>

            {/* 미개봉 통 수 */}
            <div className="create-field">
              <label htmlFor="unopenedBottleCount">
                <LockKeyhole size={18} />
                <span>미개봉 수량 <b>*</b></span>
              </label>

              <div className="create-input-unit">
                <input
                  id="unopenedBottleCount"
                  name="unopenedBottleCount"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue="0"
                  required
                />
                <span>통</span>
              </div>
            </div>

            {/* 1회 섭취량 */}
            <div className="create-field">
              <label htmlFor="servingSize">
                <Pill size={18} />
                <span>1회 섭취량 <b>*</b></span>
              </label>

              <div className="create-input-unit">
                <input
                  id="servingSize"
                  name="servingSize"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue="1"
                  required
                />
                <span>정</span>
              </div>
            </div>

            {/* 하루 섭취 횟수 */}
            <div className="create-field">
              <label htmlFor="servingsPerDay">
                <Clock3 size={18} />
                <span>하루 섭취 횟수 <b>*</b></span>
              </label>

              <div className="create-input-unit">
                <input
                  id="servingsPerDay"
                  name="servingsPerDay"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue="1"
                  required
                />
                <span>회</span>
              </div>
            </div>

            {/* 섭취 요일 */}
            <div className="create-field">
              <label htmlFor="intakeSchedule">
                <CalendarDays size={18} />
                <span>섭취 요일 <b>*</b></span>
              </label>

              <input
                id="intakeSchedule"
                name="intakeSchedule"
                type="text"
                list="intake-schedule-options"
                defaultValue="매일"
                placeholder="예: 매일, 월수금"
                required
              />

              <datalist id="intake-schedule-options">
                <option value="매일" />
                <option value="월수금" />
              </datalist>
            </div>

          </section>

          {/* 오류 메시지 */}
          {error && (
            <p className="create-error" role="alert">
              {error}
            </p>
          )}

          {/* 등록 버튼 */}
          <button
            className="create-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "등록 중..." : "등록하기"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default SupplementCreatePage;
