"use client";

import React from "react";

const Header = () => {
  return (
    <header className="fixed top-0 z-50 w-full py-4 px-6 bg-white flex justify-between items-center border-b-2 border-gray-100">
      <img src="/logo.jpg" alt="Logo" className="h-14" />
    </header>
  );
};

export default Header;