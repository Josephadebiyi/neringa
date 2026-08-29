// Displays a date of birth with the exact year hidden — shows the month, day,
// and only the century (first two digits of the year), e.g. "Mar 15, 19**"
// for 1985-03-15. Used wherever an admin views a user/representative's DOB,
// so the full birth year isn't exposed in the dashboard.
export function maskDateOfBirth(dateString?: string | null): string {
  if (!dateString) return "Not provided";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not provided";
  const monthDay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const centuryDigits = String(date.getFullYear()).slice(0, 2);
  return `${monthDay}, ${centuryDigits}**`;
}
