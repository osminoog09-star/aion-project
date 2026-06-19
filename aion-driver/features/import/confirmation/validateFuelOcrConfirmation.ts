export type FuelOcrConfirmationInput = {
  total: number | null;
  liters: number;
  unitPrice: number;
  confidence: number;
  totalEditedByUser: boolean;
};

export type FuelOcrConfirmationValidation =
  | { valid: true; message: null }
  | { valid: false; message: string };

export function validateFuelOcrConfirmation(
  input: FuelOcrConfirmationInput,
): FuelOcrConfirmationValidation {
  if (input.total == null || !Number.isFinite(input.total) || input.total <= 0) {
    return { valid: false, message: "Укажите сумму чека больше нуля." };
  }
  if (!Number.isFinite(input.liters) || input.liters < 0) {
    return { valid: false, message: "Литры не могут быть отрицательными." };
  }
  if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
    return { valid: false, message: "Цена за единицу не может быть отрицательной." };
  }
  if (input.confidence < 0.55 && !input.totalEditedByUser) {
    return {
      valid: false,
      message: "OCR не уверен в сумме. Проверьте и введите её вручную.",
    };
  }
  return { valid: true, message: null };
}
