/**
 * Input validation for This Moment in History API
 */

function validateRequest(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const { month, day, spin } = body;

  if (month === undefined || month === null) {
    return { valid: false, error: 'month is required' };
  }

  if (day === undefined || day === null) {
    return { valid: false, error: 'day is required' };
  }

  const monthNum = Number(month);
  const dayNum = Number(day);
  const spinNum = Number(spin ?? 0);

  if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
    return { valid: false, error: 'month must be an integer between 1 and 12' };
  }

  if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31) {
    return { valid: false, error: 'day must be an integer between 1 and 31' };
  }

  if (!Number.isInteger(spinNum) || spinNum < 0 || spinNum > 50) {
    return { valid: false, error: 'spin must be an integer between 0 and 50' };
  }

  return {
    valid: true,
    data: { month: monthNum, day: dayNum, spin: spinNum }
  };
}

module.exports = { validateRequest };
