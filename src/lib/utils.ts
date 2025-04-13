// export const formatTime = (dateString: string) => {
//     const date = new Date(dateString);
//     const hours = date.getHours();
//     const minutes = String(date.getMinutes()).padStart(2, "0");
//     return `${hours}:${minutes}`;
//   };


export const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  };
  return date.toLocaleTimeString("ja-JP", options);
};
  
  export const isSameDay = (date1: string, date2: string) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };
  