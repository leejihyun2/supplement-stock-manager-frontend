import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";

import {
  ArrowLeft,
  Pill,
  Package,
  Layers,
  LockKeyhole,
  CalendarDays,
  Clock3,
} from "lucide-react";

import {
  getSupplementDetail,
  updateSupplement,
} from "../api/supplementApi";

import type {
  SupplementDetail,
  SupplementUpdateRequest,
} from "../types/supplement";

// 기존 영양제 등록 화면 CSS 재사용
import "./SupplementCreatePage.css";

function SupplementUpdatePage() {
  // URL에서 수정할 영양제 ID 가져오기
  // 예: /supplements/6/edit -> id = "6"
  const { id } = useParams();
  const supplementId = Number(id);

  const navigate = useNavigate();

  // 기존 영양제 상세 데이터
  const [supplement, setSupplement] =
    useState<SupplementDetail | null>(null);

  // 조회 및 수정 진행 상태
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 오류 메시지
  const [error, setError] = useState<string | null>(null);

  // 유효한 영양제 ID인지 확인
  const validId =
    id !== undefined &&
    Number.isSafeInteger(supplementId) &&
    supplementId > 0;

  /**
   * 수정 화면에 처음 진입하면 기존 영양제 정보를 조회한다.
   *
   * GET /supplements/{supplementId}
   */
  useEffect(() => {
    if (!validId) {
      setLoading(false);
      setError("올바르지 않은 영양제 ID입니다.");
      return;
    }

    const controller = new AbortController();

    async function loadSupplement() {
      try {
        setLoading(true);
        setError(null);
        setSupplement(null);

        // 기존 상세 조회 API 재사용
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
              : "영양제 조회 중 오류가 발생했습니다."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSupplement();

    // 페이지가 종료되면 진행 중인 요청 취소
    return () => controller.abort();
  }, [supplementId, validId]);


  /**
   * 수정 정보를 저장한다.
   *
   * PUT /supplements/{supplementId}
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validId || saving) return;

    // 입력된 폼 데이터 읽기
    const formData = new FormData(event.currentTarget);

    // 백엔드 SupplementUpdateRequest 형식으로 변환
    const request: SupplementUpdateRequest = {
      supplementName: String(
        formData.get("supplementName") ?? ""
      ).trim(),

      totalQuantity: Number(
        formData.get("totalQuantity")
      ),

      currentStock: Number(
        formData.get("currentStock")
      ),

      unopenedBottleCount: Number(
        formData.get("unopenedBottleCount")
      ),

      servingSize: Number(
        formData.get("servingSize")
      ),

      servingsPerDay: Number(
        formData.get("servingsPerDay")
      ),

      intakeSchedule: String(
        formData.get("intakeSchedule") ?? ""
      ).trim(),
    };

    // 현재 재고가 한 통의 총 수량을 넘으면 수정 불가
    if (request.currentStock > request.totalQuantity) {
      setError("현재 재고는 총 개수를 초과할 수 없습니다.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // 수정 API 호출
      await updateSupplement(supplementId, request);

      // 수정 성공 시 다시 상세 화면으로 이동
      // replace를 사용해 수정 폼이 뒤로 가기 기록에 남지 않게 한다
      navigate(`/supplements/${supplementId}`, {
        replace: true,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "영양제 수정 중 오류가 발생했습니다."
      );
    } finally {
      setSaving(false);
    }
  }

  // 섭취 요일 데이터를 입력창에 표시할 문자열로 변환
  function getScheduleValue(
    value: string | string[]
  ): string {
    return Array.isArray(value)
      ? value.join(", ")
      : value ?? "";
  }

  return (
    <div className="create-page">

      {/* 상단 헤더 */}
      <header className="create-header">
        <Link
          to={`/supplements/${id}`}
          className="create-back"
          aria-label="영양제 상세 화면으로 돌아가기"
        >
          <ArrowLeft size={24} />
        </Link>

        <h1>영양제 정보 수정</h1>
      </header>

      <main className="create-content">

        {/* 로딩 중 */}
        {loading ? (
          <p>영양제 정보를 불러오는 중입니다.</p>

        ) : !supplement ? (
          // 데이터 조회 실패
          <div role="alert">
            <p>{error ?? "영양제 정보를 찾을 수 없습니다."}</p>
            <Link to="/supplements">
              영양제 목록으로 돌아가기
            </Link>
          </div>

        ) : (
          <>
            {/* 수정 화면 소개 */}
            <div className="create-intro">
              <div className="create-intro-icon">
                <Pill size={28} />
              </div>

              <div>
                <h2>영양제 정보를 수정해주세요</h2>
                <p>변경할 정보를 입력한 후 저장해주세요.</p>
              </div>
            </div>

            {/* 영양제 수정 폼 */}
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
                    defaultValue={supplement.supplementName}
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
                      defaultValue={supplement.totalQuantity}
                      required
                    />
                    <span>개</span>
                  </div>
                </div>

                {/* 현재 개수 */}
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
                      defaultValue={supplement.currentStock}
                      required
                    />
                    <span>개</span>
                  </div>
                </div>

                {/* 미개봉 수량 */}
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
                      defaultValue={
                        supplement.unopenedBottleCount
                      }
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
                      defaultValue={supplement.servingSize}
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
                      defaultValue={supplement.servingsPerDay}
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
                    defaultValue={getScheduleValue(
                      supplement.intakeSchedule
                    )}
                    list="update-schedule-options"
                    required
                  />

                  <datalist id="update-schedule-options">
                    <option value="매일" />
                    <option value="월수금" />
                  </datalist>
                </div>
              </section>

              {/* 수정 실패 시 오류 메시지 */}
              {error && (
                <p className="create-error" role="alert">
                  {error}
                </p>
              )}

              {/* 저장 버튼 */}
              <button
                type="submit"
                className="create-submit"
                disabled={saving}
              >
                {saving ? "저장 중..." : "수정 완료"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

export default SupplementUpdatePage;
