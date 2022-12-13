var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require("cors");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var captionsRouter = require('./routes/captions');
var tweetsRouter = require('./routes/tweets');
var scheduleTweetRouter = require('./routes/scheduleTweet');
var downloadPosterRouter = require('./routes/downloadPosterRouter');
var listPosterRouter = require('./routes/listPosterRouter');
var imageHashRouter = require('./routes/imageHash');

var runScheduler = require('./utility/scheduler');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/captions', captionsRouter);
app.use('/tweets', tweetsRouter);
app.use('/schedule-tweet', scheduleTweetRouter);
app.use('/download-poster', downloadPosterRouter);
app.use('/poster', listPosterRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

runScheduler();

module.exports = app;
