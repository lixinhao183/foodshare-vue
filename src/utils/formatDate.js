/**
 * 格式化日期时间
 * @param {string | number | Date} value
 * @param {string} format 'YYYY-MM-DD HH:mm:ss' 或 'relative'
 * @returns {string}
 */
export function formatDate(value, format = "YYYY-MM-DD HH:mm:ss") {
  if (!value) return "";

  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);

  if (format === "relative") {
    return formatRelativeTime(date);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  if (format === "YYYY-MM-DD") {
    return `${year}-${month}-${day}`;
  }

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化为相对时间
 * @param {Date} date
 * @returns {string}
 */
function formatRelativeTime(date) {
  const now = new Date();
  const diff = (now - date) / 1000; // 秒

  if (diff < 0) return "刚刚";
  if (diff < 60) return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}个月前`;

  return `${Math.floor(diff / 31536000)}年前`;
}
