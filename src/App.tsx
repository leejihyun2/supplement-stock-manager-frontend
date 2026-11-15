import {
  Routes,
  Route,
  useLocation,
} from "react-router";

// 영양제 기본 관리
import SupplementListPage from "./pages/SupplementListPage";
import SupplementDetailPage from "./pages/SupplementDetailPage";
import SupplementCreatePage from "./pages/SupplementCreatePage";
import SupplementUpdatePage from "./pages/SupplementUpdatePage";

// 복용 관리
import IntakePage from "./pages/IntakePage";

// 주문 추천
import RecommendationPage from "./pages/RecommendationPage";

// 소진일 캘린더
import CalendarPage from "./pages/CalendarPage";

// 홈 대시보드
import HomePage from "./pages/HomePage";

// 공통 하단 네비게이션
import BottomNavigation from "./components/BottomNavigation";

function App() {
  const location = useLocation();

  /**
   * 공통 하단 네비게이션을 표시할 페이지
   *
   * 상세·등록·수정 화면에서는 숨긴다.
   */
  const navigationPages = [
    "/",
    "/supplements",
    "/intake",
    "/recommendations",
    "/calendar",
  ];

  const showNavigation = navigationPages.includes(
    location.pathname
  );

  return (
    <>
      <Routes>
        {/* 홈 대시보드 */}
        <Route
          path="/"
          element={<HomePage />}
        />

        {/* 영양제 목록 */}
        <Route
          path="/supplements"
          element={<SupplementListPage />}
        />

        {/* 영양제 최초 등록 */}
        <Route
          path="/supplements/new"
          element={<SupplementCreatePage />}
        />

        {/* 영양제 수정 */}
        <Route
          path="/supplements/:id/edit"
          element={<SupplementUpdatePage />}
        />

        {/* 영양제 상세 */}
        <Route
          path="/supplements/:id"
          element={<SupplementDetailPage />}
        />

        {/* 오늘 복용 체크 */}
        <Route
          path="/intake"
          element={<IntakePage />}
        />

        {/* 이번 주문 추천 */}
        <Route
          path="/recommendations"
          element={<RecommendationPage />}
        />

        {/* 소진일 캘린더 */}
        <Route
          path="/calendar"
          element={<CalendarPage />}
        />
      </Routes>

      {/* 모든 주요 화면에서 공통 네비게이션 사용 */}
      {showNavigation && <BottomNavigation />}
    </>
  );
}

export default App;