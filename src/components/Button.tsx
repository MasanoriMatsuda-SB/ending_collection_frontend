// ボタンを使いたいページではまず以下でボタンコンポーネントをimportする
// import Button from "@/components/button";
// ボタンコンポーネントの書き方
// メインボタンでonClickの場合：<Button
//   title="送信する"
//   variant="main"
//   onClick={() => {
//     console.log("送信ボタンが押されました！");
//   }}
// />
// サブボタンでhref遷移の場合：<Button title="ログイン" href="/login" variant="sub" />

"use client";

import React from "react";
import { useRouter } from "next/navigation";

type ButtonProps = {
  title?: string;
  href?: string;
  variant?: "main" | "sub";
  activeScale?: number;
  onClick?: () => void;
};

const Button = ({
  title = "ボタン文言",
  href = "/",
  variant = "main",
  activeScale = 0.95,
  onClick
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
    "w-[calc(100%-40px)] max-w-[400px] h-[52px] mx-auto block rounded-full font-bold text-center shadow transition-all duration-300 my-5";

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