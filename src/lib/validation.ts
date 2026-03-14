export function validateRequest(body: Record<string, unknown> | null) {
  if (!body || typeof body !== 'object') {
    return { valid: false as const, error: 'Request body is required' };
  }

  const { month, day, spin } = body;

  if (month === undefined || month === null) {
    return { valid: false as const, error: 'month is required' };
  }
  if (day === undefined || day === null) {
    return { valid: false as const, error: 'day is required' };
  }

  const monthNum = Number(month);
  const dayNum = Number(day);
  const spinNum = Number(spin ?? 0);

  if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
    return { valid: false as const, error: 'month must be an integer between 1 and 12' };
  }
  if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31) {
    return { valid: false as const, error: 'day must be an integer between 1 and 31' };
  }
  if (!Number.isInteger(spinNum) || spinNum < 0 || spinNum > 50) {
    return { valid: false as const, error: 'spin must be an integer between 0 and 50' };
  }

  return { valid: true as const, data: { month: monthNum, day: dayNum, spin: spinNum } };
}

export function monthName(month: number) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'January';
}

export function buildUserMessage(month: number, day: number, spin: number) {
  let spinInstruction = '';
  if (spin > 0) {
    spinInstruction = ` This is spin #${spin} — choose a DIFFERENT event from any previous response for this date. Dig deeper: find an obscure, surprising, or lesser-known moment from this date in history. The higher the spin number, the more unexpected and unconventional your choice should be.`;
  }
  return `Write a creative nonfiction vignette about a real historical event that happened on ${monthName(month)} ${day}.${spinInstruction}`;
}
