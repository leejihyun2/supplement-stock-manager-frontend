
import { NavLink } from "react-router";

import {
  House,
  SquareCheckBig,
  List,
  CalendarDays,
} from "lucide-react";

import "./BottomNavigation.css";

/**
 * 공통 하단 네비게이션
 *
 * NavLink는 현재 URL과 일치하는 메뉴를
 * 자동으로 활성화할 수 있다.
 */
function BottomNavigation() {
  return (
    <nav
      className="app-bottom-nav"
      aria-label="하단 네비게이션"
    >
      {/* 홈: 아직 구현하지 않았으므로 비활성화 */}
      <span
        className="app-nav-item app-nav-disabled"
        aria-disabled="true"
      >
        <House size={23} />
        <span>홈</span>
      </span>

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
