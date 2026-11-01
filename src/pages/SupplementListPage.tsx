import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Pill,
  ChevronRight,
  House,
  SquareCheckBig,
  List,
  CalendarDays,
} from "lucide-react";

import { getSupplements } from "../api/supplementApi";
import type { Supplement } from "../types/supplement";
import "./SupplementListPage.css";

// 소진일까지 남은 일수에 따라 배지 색상 결정
function getStockStatus(days: number): string {
  if (days <= 14) return "danger";
  if (days <= 30) return "warning";
  return "safe";
}

function SupplementListPage() {
  // 영양제 목록 데이터를 저장할 상태
  const [supplements, setSupplements] = useState<Supplement[]>([]);

  // API 요청 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 페이지가 처음 표시될 때 영양제 목록 조회
  useEffect(() => {
    const controller = new AbortController();

    async function loadSupplements() {
      try {
        setLoading(true);
        setError(null);

        // Spring Boot API 호출
        const data = await getSupplements(controller.signal);

        // 조회한 데이터 저장
        if (!controller.signal.aborted) {
          setSupplements(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          const message =
            err instanceof Error ? err.message : "알 수 없는 오류";
          setError(message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSupplements();

    // 컴포넌트 정리 시 진행 중인 요청 취소
    return () => controller.abort();
  }, []);

  return (
    <div className="app-shell">
      {/* 상단 헤더 */}
      <header className="app-header">
        <span className="back-icon">
          <ArrowLeft size={24} />
        </span>

        <h1>영양제 목록</h1>

        <span className="add-icon">
          <Plus size={22} />
        </span>
      </header>

      <main className="page-content">
        {/* 총 등록된 영양제 */}
        <section className="summary-card">
          <div className="summary-icon">
            <Pill size={27} />
          </div>

          <div>
            <p className="summary-label">총 등록된 영양제</p>
            <p className="summary-count">{supplements.length}개</p>
          </div>
        </section>

        {/* API 요청 상태에 따른 화면 */}
        {loading ? (
          <p>영양제 목록을 불러오는 중입니다.</p>
        ) : error ? (
          <p role="alert">조회 오류: {error}</p>
        ) : supplements.length === 0 ? (
          <p>등록된 영양제가 없습니다.</p>
        ) : (
          <section className="supplement-list">
            {supplements.map((supplement) => (
              <article
                className="supplement-card"
                key={supplement.supplementId}
              >
                <div className="supplement-info">
                  <h2>{supplement.supplementName}</h2>
                  <p>현재 개수: {supplement.currentStock}정</p>
                </div>

                <div className="supplement-right">
                  <span
                    className={`stock-badge ${getStockStatus(
                      supplement.daysUntilDepletion
                    )}`}
                  >
                    {supplement.daysUntilDepletion}일 후 소진
                  </span>

                  <ChevronRight size={18} className="chevron" />
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {/* 하단 네비게이션 - 이동 기능은 이후 구현 */}
      <nav className="bottom-nav" aria-label="하단 메뉴">
        <div className="nav-item">
          <House size={23} />
          <span>홈</span>
        </div>

        <div className="nav-item">
          <SquareCheckBig size={23} />
          <span>오늘 체크</span>
        </div>

        <div className="nav-item active" aria-current="page">
          <List size={23} />
          <span>영양제 목록</span>
        </div>

        <div className="nav-item">
          <CalendarDays size={23} />
          <span>캘린더</span>
        </div>
      </nav>
    </div>
  );
}

export default SupplementListPage;
