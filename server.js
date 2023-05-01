// متنساش تعمل تحديث للباكدج عشان تكون محمية
// npm audit fix عشان احدث الباكدج اللي فيها المشاكل
// حاول انك متستخدمش ريجلراكسبرشن لانها بتاخد وقت كبير في التنفيذ وممكن الهاكر يستغل الثغرة دي و يعطل البروجيكت

const path = require('path');

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongoSanatitize =require('mongo-express-sanitize')
const xss= require("xss-clean")

dotenv.config({ path: 'config.env' });
const ApiError = require('./utils/apiError');
const globalError = require('./middlewares/errorMiddleware');
const dbConnection = require('./config/database');
// Routes
const mountRoutes = require('./routes');
const { webhookCheckout } = require('./services/orderService');

// Connect with db
dbConnection();

// express app
const app = express();

// Enable other domains to access your application
app.use(cors());
app.options('*', cors());

// compress all responses
app.use(compression());

// Checkout webhook
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout
);

// Middlewares
// هستخدم ليمت عشان اتحكم في حجم الداتا اللي جايا في الريكوست عشان متاثرش على السيرفير ميموي و السيرفير ديسك سباس
// السيرفير هو الريسورسز اللي محتاجين نحافظ عليه

app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'uploads')));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`mode: ${process.env.NODE_ENV}`);
}
// الهاكر ممكن يضيف منجو كويري في الانبت و يحصل على داتا من الداتا بيز
// هستخدم الميدل وير دي عشان اطهر الداتا اللي جاية من المونجو كويري
// email:{"$gt":""}
app.use(mongoSanatitize())
// هستخدم الميدل وير دي عشان اطهر الداتا اللي جاية من الاسكربت تاج
//"Name": <script>Dander</script>
app.use(xss())

// للحماية من تخمينات الرقم السري اللي بيعملها الهاكرز هعمل ليمت بيحدد عدد الريكوستات اللي جاية
// Limit each IP to 100 requests per `window` (here, per 15 minutes)
// هعمل 100 ركوست في 15 دقيقة
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message:
    'Too many accounts created from this IP, please try again after an hour',
});

// Apply the rate limiting middleware to all requests
app.use('/api', limiter);

// Middleware to protect against HTTP Parameter Pollution attacks
// نوع من الهجمات بيستخدمها الهكر عشان يقدر يبعت اكتر من براميتر بنفس الاسم في ال اتش تي تي بي ركويست
// http://api/product?sort=price&sort=sold  مثال
// لان الهكر لما يبعت اكتر من براميتر بنفس الاسم اكسبريس بتحطهم في مصفوفة وبتطبقهم كلهم
// hpp بيلغي البراميتر اللي متكرر و يختار اخر واحد ويطبقه
app.use(
  hpp({
    whitelist: [ //الحجات او البراميتر اللي مش عايز يتطبق عليها الميدل وير دي
      'price', // http://api/product?price=50&price=75  مثال
      'sold',
      'quantity',
      'ratingsAverage',
      'ratingsQuantity',
    ],
  })
);

// Mount Routes
mountRoutes(app);

app.all('*', (req, res, next) => {// ههندل ايرور لو دخل على راوت مش موجود
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));// كده هبعت الايرور دي للجلوبال ايرور باستخدام نكست
});

// Global error handling middleware for express
app.use(globalError);// الروت الخاص بالجلوبال ايرور

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`App running running on port ${PORT}`);
});

// Handle rejection outside express اي ايرور هيحصل خارج 
// rejection => asnc function
process.on('unhandledRejection', (err) => {
  console.error(`UnhandledRejection Errors: ${err.name} | ${err.message}`);
  server.close(() => { // بوقف السيرفير عشان لو في ركوستات شغالة هيخلصها الاول
    console.error(`Shutting down....`);
    process.exit(1); // بوقف البروجكت
  });
});
