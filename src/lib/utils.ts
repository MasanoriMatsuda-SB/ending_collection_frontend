
  
export const isSameDay = (date1: string, date2: string) => {
  return (
    new Date(date1).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" }) ===
    new Date(date2).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })
  );
};

export const formatTime = (dateString: string) => {
  const utcDate = new Date(dateString);
  const jstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000); // UTC → JST

  const hour = String(jstDate.getHours()).padStart(2, "0");
  const minute = String(jstDate.getMinutes()).padStart(2, "0");

  return `${hour}:${minute}`;
};