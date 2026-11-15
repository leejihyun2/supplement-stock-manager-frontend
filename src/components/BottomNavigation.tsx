
import { NavLink } from "react-router";

import {
  House,
  SquareCheckBig,
  List,
  CalendarDays,
} from "lucide-react";

import "./BottomNavigation.css";

/**
 * 모든 주요 페이지에서 사용하는 공통 네비게이션
 *
 * NavLink가 현재 URL을 확인하여
 * active 클래스를 자동 적용한다.
 */
function BottomNavigation() {
  return (
    <nav
      className="app-bottom-nav"
      aria-label="하단 네비게이션"
    >

      {/* 홈 대시보드 */}
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `app-nav-item ${isActive ? "active" : ""}`
        }
      >
        <House size={23} />
        <span>홈</span>
      </NavLink>

      {/* 오늘 복용 체크 */}
      <NavLink
        to="/intake"
        className={({ isActive }) =>
          `app-nav-item ${isActive ? "active" : ""}`
        }
      >
        <SquareCheckBig size={23} />
        <span>오늘 체크</span>
      </NavLink>

      {/* 영양제 목록 */}
      <NavLink
        to="/supplements"
        end
        className={({ isActive }) =>
          `app-nav-item ${isActive ? "active" : ""}`
        }
      >
        <List size={23} />
        <span>영양제 목록</span>
      </NavLink>

      {/* 소진일 캘린더 */}
      <NavLink
        to="/calendar"
        className={({ isActive }) =>
          `app-nav-item ${isActive ? "active" : ""}`
        }
      >
        <CalendarDays size={23} />
        <span>캘린더</span>
      </NavLink>

    </nav>
  );
}

export default BottomNavigation;
