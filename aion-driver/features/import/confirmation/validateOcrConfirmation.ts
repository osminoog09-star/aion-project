export type OcrConfirmationInput = {
  earnings: number;
  trips: Array<{ amount: number }>;
};

export type OcrConfirmationValidation =
  | { valid: true; message: null }
  | { valid: false; message: string };

export function validateOcrConfirmation(
  input: OcrConfirmationInput,
): OcrConfirmationValidation {
  if (input.trips.some((trip) => !Number.isFinite(trip.amount) || trip.amount <= 0)) {
    return {
      valid: false,
      message: "Сумма каждой поездки должна быть больше нуля.",
    };
  }

  if (!Number.isFinite(input.earnings) || input.earnings <= 0) {
    return {
      valid: false,
      message: "OCR не нашёл выплату. Исправьте суммы или распознайте источник ещё раз.",
    };
  }

  return { valid: true, message: null };
}
