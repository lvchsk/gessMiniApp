export function formatDate(date: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  return `${pad(date.getDate())}:${pad(date.getMonth() + 1)}:${date.getFullYear()}_${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
