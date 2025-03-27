"use client";

import React from "react";
import { useRouter } from "next/navigation";

type ButtonProps = {
  title?: string;
  href?: string;
  variant?: "main" | "sub";
  activeScale?: number;
  onClick?: () => void;
  type?: "button" | "submit";
};

const Button = ({
  title = "ボタン文言",
  href = "/",
  variant = "main",
  activeScale = 0.95,
  onClick,
  type = "button"
}: ButtonProps) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  const isMain = variant === "main";

  const baseStyle =
    "w-full max-w-md h-[52px] rounded-full font-bold text-center shadow transition-all duration-300 my-3";

  const mainStyle = {
    backgroundColor: "#7B6224",
    color: "white",
    border: "none",
  };

  const subStyle = {
    backgroundColor: "white",
    color: "#7B6224",
    border: "2px solid #7B6224",
  };

  const hoverMainColor = "#A8956F";
  const hoverSubColor = "#A8956F";

  return (
    <button
      type={type}
      onClick={handleClick}
      className={baseStyle}
      style={isMain ? mainStyle : subStyle}
      onMouseEnter={(e) => {
        if (isMain) {
          e.currentTarget.style.backgroundColor = hoverMainColor;
        } else {
          e.currentTarget.style.borderColor = hoverSubColor;
          e.currentTarget.style.color = hoverSubColor;
        }
      }}
      onMouseLeave={(e) => {
        if (isMain) {
          e.currentTarget.style.backgroundColor = mainStyle.backgroundColor;
        } else {
          e.currentTarget.style.borderColor = "#7B6224";
          e.currentTarget.style.color = "#7B6224";
        }
        e.currentTarget.style.transform = "scale(1)";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = `scale(${activeScale})`;
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {title}
    </button>
  );
};

export default Button;