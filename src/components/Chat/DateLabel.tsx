"use client";

interface DateLabelProps {
  dateString: string;
}

export default function DateLabel({ dateString }: DateLabelProps) {
  const formatted = new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="text-center text-xs text-gray-500 my-2">
      <span className="bg-white px-2 py-1 rounded shadow-sm">{formatted}</span>
    </div>
  );
}
