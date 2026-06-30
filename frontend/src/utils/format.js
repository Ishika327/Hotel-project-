export const formatCurrency = (value) =>
  new Intl.NumberFormat("ne-NP", { style: "currency", currency: "NPR" }).format(
    Number(value || 0),
  );

export const formatDate = (value) => {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};
