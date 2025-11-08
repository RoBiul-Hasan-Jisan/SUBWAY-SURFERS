import { useState } from "react";
import {
  HiOutlineUser,
  HiOutlineMagnifyingGlass,
  HiOutlineShoppingBag,
  HiBars3,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import SidebarMenu from "./SidebarMenu";

const Header = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
          
          {/* Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-transform duration-200 transform hover:scale-110"
            aria-label="Open menu"
          >
            <HiBars3 className="text-2xl text-gray-700" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex flex-col items-center group">
            <span className="text-3xl font-serif font-bold text-gray-900 group-hover:text-indigo-600 transition-all duration-300 transform hover:scale-105">
              ELEGANCE
            </span>
            <span className="text-xs text-gray-500 tracking-widest font-light -mt-1">
              LUXURY FASHION
            </span>
          </Link>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            <Link
              to="/search"
              className="header-icon-btn"
              aria-label="Search"
            >
              <HiOutlineMagnifyingGlass />
            </Link>
            <Link
              to="/login"
              className="header-icon-btn"
              aria-label="Account"
            >
              <HiOutlineUser />
            </Link>
            <Link
              to="/cart"
              className="header-icon-btn relative"
              aria-label="Shopping cart"
            >
              <HiOutlineShoppingBag />
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-md animate-pulse">
                0
              </span>
            </Link>
          </div>
        </div>
      </header>

      <SidebarMenu
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
    </>
  );
};

export default Header;
