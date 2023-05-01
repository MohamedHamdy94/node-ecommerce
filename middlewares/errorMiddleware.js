const ApiError = require('../utils/apiError');

const sendErrorForDev = (err, res) => //هترن في الديفلوبمنت مود 
  res.status(err.statusCode).json({ // عشان اهندل شكل الايرور اللي راجعلى
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,// المكان اللي حصل فيه اليرور  
  });

const sendErrorForProd = (err, res) =>// هيرن في  البرودكشن مود لما المشروع يبقى ليف
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });

const handleJwtInvalidSignature = () =>
  new ApiError('Invalid token, please login again..', 401);

const handleJwtExpired = () =>
  new ApiError('Expired token, please login again..', 401);
//ميدل وير بتمسك الايرور اللي راجع من اكسبرس وارجعه ك جيسون بدل ما هو راجع ك اتش تي ام ال
const globalError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorForDev(err, res);
  } else {
    if (err.name === 'JsonWebTokenError') err = handleJwtInvalidSignature();
    if (err.name === 'TokenExpiredError') err = handleJwtExpired();
    sendErrorForProd(err, res);
  }
};

module.exports = globalError;
