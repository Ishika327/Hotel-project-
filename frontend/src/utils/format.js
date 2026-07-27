import NepaliDate from "nepali-date-converter";

export const formatCurrency = (value) =>
  new Intl.NumberFormat("ne-NP", { style: "currency", currency: "NPR" }).format(
    Number(value || 0),
  );

// Converts any AD date into a Bikram Sambat date, but keeps
// weekday/month names in English (e.g. "Thursday, 24 Magh 2083, 2:33 PM").
export const formatDate = (value) => {
  if (!value) return "N/A";

  const adDate = new Date(value);
  if (Number.isNaN(adDate.getTime())) return "N/A";

  try {
    const nepaliDate = new NepaliDate(adDate);
    const datePart = nepaliDate.format("dddd, DD MMMM YYYY", "en");
    const timePart = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(adDate);

    return `${datePart}, ${timePart}`;
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(adDate);
  }
};

// Date-only version (no time), same English-worded BS date —
// for shorter table cells like check-in/check-out.
export const formatDateOnly = (value) => {
  if (!value) return "N/A";

  const adDate = new Date(value);
  if (Number.isNaN(adDate.getTime())) return "N/A";

  try {
    const nepaliDate = new NepaliDate(adDate);
    return nepaliDate.format("DD MMMM YYYY", "en");
  } catch {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
      adDate,
    );
  }
};
