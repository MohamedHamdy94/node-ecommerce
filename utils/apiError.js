// @desc    this class is responsible about operation errors (errors that i can predict)
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith(4) ? 'fail' : 'error';
    this.isOperational = true;
    //^ يعني الايرور ده اقدر اتنبا بيه او انا اللي عامله عشان ممن اتشك  في البرودكشن مود او الديفلوبمنت مود
  }
}

module.exports = ApiError;
