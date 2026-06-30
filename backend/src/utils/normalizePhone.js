export const normalizePhone = (phoneNumber = "") => {
  let digits = String(phoneNumber || "").replace(/\D/g, "");

  if (digits.startsWith("977") && digits.length >= 13) {
    digits = digits.slice(3);
  }

  if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

  return digits;
};
