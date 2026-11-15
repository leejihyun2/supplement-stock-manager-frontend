
import {
  Navigate,
  Routes,
  Route,
  useLocation,
} from "react-router";

import SupplementListPage from "./pages/SupplementListPage";
import SupplementDetailPage from "./pages/SupplementDetailPage";
import SupplementCreatePage from "./pages/SupplementCreatePage";
import SupplementUpdatePage from "./pages/SupplementUpdatePage";

import IntakePage from "./pages/IntakePage";
import RecommendationPage from "./pages/RecommendationPage";
import CalendarPage from "./pages/CalendarPage";

// 공통 하단 네비게이션
import BottomNavigation from "./components/BottomNavigation";

function App() {
  // 현재 페이지 경로
  const location = useLocation();

  /**
   * 네비게이션을 표시할 페이지
   *
   * 등록·수정·상세 페이지에서는
   * 기존 디자인에 맞춰 표시하지 않는다.
   */
  const navigationPages = [
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
      {/* 화면별 라우팅 */}
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/supplements" replace />}
        />

        <Route
          path="/supplements"
          element={<SupplementListPage />}
        />

        <Route
          path="/supplements/new"
          element={<SupplementCreatePage />}
        />

        <Route
          path="/supplements/:id/edit"
          element={<SupplementUpdatePage />}
        />

        <Route
          path="/supplements/:id"
          element={<SupplementDetailPage />}
        />

        <Route
          path="/intake"
          element={<IntakePage />}
        />

        <Route
          path="/recommendations"
          element={<RecommendationPage />}
        />

        <Route
          path="/calendar"
          element={<CalendarPage />}
        />
      </Routes>

      {/* 네비게이션은 여기서 딱 한 번만 렌더링 */}
      {showNavigation && <BottomNavigation />}
    </>
  );
}

export default App;
