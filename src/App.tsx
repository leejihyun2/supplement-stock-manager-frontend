import { Navigate, Routes, Route } from "react-router";

import SupplementListPage from "./pages/SupplementListPage";
import SupplementDetailPage from "./pages/SupplementDetailPage";

function App() {
  return (
    <Routes>
      {/* 기본 주소 접속 시 영양제 목록으로 이동 */}
      <Route
        path="/"
        element={<Navigate to="/supplements" replace />}
      />

      {/* 영양제 목록 화면 */}
      <Route
        path="/supplements"
        element={<SupplementListPage />}
      />

      {/* 영양제 상세 화면 */}
      <Route
        path="/supplements/:id"
        element={<SupplementDetailPage />}
      />
    </Routes>
  );
}

export default App;