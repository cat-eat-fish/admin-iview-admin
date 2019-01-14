var createError = require('http-errors');
var express = require('express');
var session = require('express-session');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  next();
});
 
app.all('/', function(req, res){
  console.log("=======================================");
  console.log("请求路径："+req.url);
  var filename = req.url.split('/')[req.url.split('/').length-1];
  var suffix = req.url.split('.')[req.url.split('.').length-1];
  console.log("文件名：", filename);
  if(req.url==='/'){
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(get_file_content(path.join(__dirname, 'html', 'index.html')));
  }else if(suffix==='css'){
    res.writeHead(200, {'Content-Type': 'text/css'});
    res.end(get_file_content(path.join(__dirname, 'public', 'css', filename)));
  }else if(suffix in ['gif', 'jpeg', 'jpg', 'png']) {
    res.writeHead(200, {'Content-Type': 'image/'+suffix});
    res.end(get_file_content(path.join(__dirname, 'public', 'images', filename)));
  }
});
 
 
function get_file_content(filepath){
  return fs.readFileSync(filepath);
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
// app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: '12345',
  name: 'testapp',   //这里的name值得是cookie的name，默认cookie的name是：connect.sid
  cookie: {maxAge: 80000 },  //设置maxAge是80000ms，即80s后session和相应的cookie失效过期
  resave: false,
  saveUninitialized: true,
}));
app.use(express.static(path.join(__dirname, './public')));
app.use(express.static(path.join(__dirname, './upload')));

app.use('/', indexRouter);
app.use('/users', usersRouter);




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




module.exports = app;

// var server = app.listen(3000, function () {
//   var host = server.address().address
//   var port = server.address().port
//   console.log("应用实例，访问地址为 http://%s:%s", host, port)
// })
