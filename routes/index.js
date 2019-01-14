var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extended:false}));
var multiparty = require('multiparty');;
var util = require('util');
var fs = require('fs');
var image = require('imageinfo'); //引用imageinfo模块
var path = require('path');
/* 导入mysql模块 */
var mysql = require('mysql');
var pool = mysql.createPool({
  host:'localhost',
  port     : 3306,    // 数据库连接的端口号 默认是3306  
  database : 'iview', // 需要查询的数据库  
  user     : 'root',  // 用户名  
  password : 'root'   // 密码，我的密码是空。所以是空字符串  
});                   // 使用DBConfig.js的配置信息创建一个MySQL连接池
// 时间格式化
function formateDate(datetime,type) {
  var year = datetime.getFullYear(),
      month = ("0" + (datetime.getMonth() + 1)).slice(-2),
      date = ("0" + datetime.getDate()).slice(-2),
      hour = ("0" + datetime.getHours()).slice(-2),
      minute = ("0" + datetime.getMinutes()).slice(-2),
      second = ("0" + datetime.getSeconds()).slice(-2);
  if(type === "Y-M-D h:min:s"){
      var result = year + "-"+ month +"-"+ date +" "+ hour +":"+ minute +":" + second;
  }else if(type === "Y-M-D"){
      var result = year + "-"+ month +"-"+ date;
  }if(type === "h:min:s"){
      var result = hour +":"+ minute +":" + second;
  }
  return result;
}
// 从URL中解析参数
function getParams (url) {
  const keyValueArr = url.split('?')[1].split('&')
  let paramObj = {}
  keyValueArr.forEach(item => {
    const keyValue = item.split('=')
    paramObj[keyValue[0]] = keyValue[1]
  })
  return paramObj;
}
// 数据库废用图片处理
//获取项目工程里的图片
function readFileList(path, filesList) {
  var files = fs.readdirSync(path);
  files.forEach(function (itm, index) {
    var stat = fs.statSync(path + itm);
    if (stat.isDirectory()) {
    //递归读取文件
      readFileList(path + itm + "/", filesList)
    } else {
      var obj = {};//定义一个对象存放文件的路径和名字
      obj.path = path;//路径
      obj.filename = itm//名字
      filesList.push(obj);
    }
  })
}
var getFiles = {
  //获取文件夹下的所有文件
  getFileList: function (path) {
    var filesList = [];
    readFileList(path, filesList);
    return filesList;
  },
  //获取文件夹下的所有图片
  getImageFiles: function (path) {
    var imageList = [];
    this.getFileList(path).forEach((item) => {
      var ms = image(fs.readFileSync(item.path + item.filename));
      ms.mimeType && (imageList.push(item.filename))
    });
    return imageList;
  }
};
//获取文件夹下的所有图片
// console.log(getFiles.getImageFiles("./upload/"));
//获取文件夹下的所有文件
// console.log(getFiles.getFileList("./upload/"));










    

// 登录
// router.post('/api/login', function(req, res, next) {
//   var username = req.body.userName,
//       password = req.body.password;
//       console.log(username,password);
//   pool.query(`SELECT username FROM admin`,function(error, rows2, fields){
//         if(error){
//           console.log(error);
//           res.json({status:400, message: '验证失败！'});
//         }
//         if(rows2.indexOf(username) === -1){
//           res.json({status:400,message:"用户名不存在！"});
//         }else{
//             pool.query(`SELECT * FROM admin WHERE username='${username}'`,function(error, rows, fields){
//             if(error){console.log( error)};
//             console.log(rows)
//             res.json({status:200,message:"注册成功！",data:rows})  
//             });
//           }
//       })
// });

/* 上传页面. */
router.get('/', function(req, res, next) {
  res.sendfile('./views/index.html');
});
// 测试页面
router.get('/api/', function(req, res, next) {
  if(req.session.lastPage) {
    console.log('Last page was: ' + req.session.lastPage + ".");    
  }    
  req.session.lastPage = '/awesome'; //每一次访问时，session对象的lastPage会自动的保存或更新内存中的session中去。
  res.send("You're Awesome. And the session expired time is: " + req.session.cookie.maxAge);
});

/* ==================================================================  管理员管理  =============================================== */
// 添加管理员信息
router.post('/api/myaddAdmin', function(req, res) {
  var username = req.body.nusername,
      password = req.body.npassword,
      name = req.body.nname,
      card = req.body.ncard,
      phone = req.body.nphone,
      address =  req.body.ncity ,
      ip = req.body.nip,
      registeraddress = req.body.nregisteraddress,
      thumb = "./public/images/admin_thumb.png";
      pool.query(`SELECT username FROM admin`,function(error, rows2, fields){
        if(error){
          console.log(error);
          res.json({status:400, message: '验证失败！'});
        }
          if(rows2.indexOf(username) === -1){
            pool.query(`INSERT INTO admin (username,password,name,thumb,card,address,phone,registeraddress,ip) VALUES ("${username}","${password}","${name}","${thumb}",${card},"${address}",${phone},"${registeraddress},"${ip}")`,function(error, rows, fields){
              if(error){console.log( error)};
              if(rows.affectedRows !== 1){
                res.json({status:400,message:"注册失败！"});
              }else{
                res.json({status:200,message:"注册成功！"})
              }
            });
          }else{
            res.json({status:201, message: '用户名已存在！'});
          }
      })
})
//管理员上传头像
router.post('/api/file/uploading', function(req, res) {
  var form = new multiparty.Form();
  form.encoding = 'utf-8';        
  var ndate = new Date();
  var nstamp = ndate.getTime();
  var Y = ndate.getFullYear();
  var M = Number(ndate.getMonth())+1 < 10 ? "0"+ Number(ndate.getMonth()+1) : ndate.getMonth()+1;
  var D = ndate.getDate() < 10 ? "0"+ ndate.getDate() : ndate.getDate(); 
  var folderName = String(Y)+String(M)+String(D);   
  function doupload () {
      form.uploadDir = `upload/admin/${folderName}`;         //设置文件存储路径
      form.maxFilesSize = 2 * 1024 * 1024;        //设置单文件大小限制
      //form.maxFields = 1000;  设置所以文件的大小总和    对于多文件
      //上传完成后处理
      form.parse(req, function(err, fields, files) {
        var obj ={};
        var filesTmp = JSON.stringify(files,null,2);
        var id = fields.id ? fields.id : -1;
        if(err){
          console.log('parse error: ' + err);
          res.json({status:400, message: '上传失败！'});
        }else{
          var inputFile = files.inputFile[0];
          var uploadedPath = inputFile.path;
          var fileFormat = (inputFile.originalFilename).split(".")[1];
          var dstPath = `./upload/admin/${folderName}/` + nstamp + "." + fileFormat;
          //重命名为真实文件名
          fs.rename(uploadedPath, dstPath, function(err) {
            if(err){
              console.log('rename error: ' + err);
              res.JSON({status:400, message: '上传失败！'});
            } else {
              console.log('rename ok'); 
              pool.query(`UPDATE admin SET thumb="${dstPath}" WHERE id=${id}`,function(error, rows, fields){
                if(error){
                  res.json({status:400, message: '更新失败！'});
                }else if(rows.affectedRows !== 1){
                  res.json({status:400, message: '更新失败！'});
                }else {
                  res.json({status:200, message: '更新成功！'});
                }
              })
            }
          });
        }
      });
  }
  fs.exists(`upload/admin/${folderName}`, function(exists) {
    if(!exists){
      fs.mkdirSync(`./upload/admin/${folderName}`)
      doupload ();
    }else{
      doupload ();
    }
  });
 });
// 获取admin管理员信息
router.post('/api/admin', function(req, res, next) {
  pool.query('select  * from admin', function(err, rows, fields) {
    if (err){throw err;} 
    // 数据处理
    rows.map((item,index)=>{
      item.date = formateDate(item.date,"Y-M-D h:min:s")
      item.name = item.name == -1 ? "未设置" : item.name;
      item.card = item.card == -1 ? "未设置" : item.card;
      item.ip = item.ip == -1 ? "未获取" : item.ip;
      item.address = item.address == -1 ? "未设置" : item.address;
    })
    res.send(rows)
  });
});
/* ==================================================================  公告_新闻管理  =============================================== */
// 获取信息
router.post('/api/notice_news',function(req,res,next){
  pool.query('select * from notice_news', function(err, rows, fields) {
    if (err){throw err;} 
    // 数据处理
    rows.map((item,index)=>{
      item.pid = item.id == 1 ? "公告" : item.id == 2 ? "新闻" : "未知分类";
      item.status = item.status == 1 ? "草稿" : item.status == 2 ? "等待审核" : item.status == 3 ? "已发布" : "未知状态";
      item.ontop = item.ontop == 1 ? "置顶" : "不置顶";
      item.iselite = item.iselite == 1 ? "推荐" : "不推荐";
      item.add_time = formateDate(item.add_time,"Y-M-D h:min:s")
    })
    res.send(rows)
  });
})
// 添加信息
router.post('/api/addnotice_news', function(req, res) {
  var form = new multiparty.Form();
  form.encoding = 'utf-8';        
  var ndate = new Date();
  var nstamp = ndate.getTime();
  var Y = ndate.getFullYear();
  var M = Number(ndate.getMonth())+1 < 10 ? "0"+ Number(ndate.getMonth()+1) : ndate.getMonth()+1;
  var D = ndate.getDate() < 10 ? "0"+ ndate.getDate() : ndate.getDate(); 
  var folderName = String(Y)+String(M)+String(D);   
  function doupload () {
      form.uploadDir = `upload/notice_news/${folderName}`;         //设置文件存储路径
      form.maxFilesSize = 2 * 1024 * 1024;        //设置单文件大小限制
      //form.maxFields = 1000;  设置所以文件的大小总和    对于多文件
      //上传完成后处理
      form.parse(req, function(err, fields, files) {
        var obj ={};
        var filesTmp = JSON.stringify(files,null,2);
        if(err){
          console.log('parse error: ' + err);
          res.json({status:400, message: '上传失败！'});
        }else{
          var inputFile = files.inputFile[0];
          var uploadedPath = inputFile.path;
          var fileFormat = (inputFile.originalFilename).split(".")[1];
          var dstPath = `./upload/notice_news/${folderName}/` + nstamp + "." + fileFormat;
          //重命名为真实文件名
          fs.rename(uploadedPath, dstPath, function(err) {
            if(err){
              console.log('rename error: ' + err);
              res.JSON({status:400, message: '上传失败！'});
            } else {
              console.log(fields)
              var name = fields.name ? fields.name : -1;
              var sort = fields.sort ? fields.sort : -1;
              var type = fields.type ? fields.type : -1;
              var link = fields.link ? fields.link : -1;
              console.log('rename ok'); 
              // pool.query(`INSERT INTO notice_news (name,type,sort,link,img) VALUES ('${name}','${type}','${sort}','${link}','${dstPath}')`,function(error, rows, fields){
              //   if(error){
              //     res.json({status:399, message: '添加失败！'});
              //   }
              //   if(rows.affectedRows !== 1){
              //     res.json({status:400, message: '添加失败！'});
              //   }else {
              //     res.json({status:200, message: '添加成功！'});
              //   }
              // })
            }
          });
        }
      });
  }
  fs.exists(`upload/notice_news/${folderName}`, function(exists) {
    if(!exists){
      fs.mkdirSync(`./upload/notice_news/${folderName}`)
      doupload ();
    }else{
      doupload ();
    }
  });
});

/* ==================================================================  广告管理  =============================================== */
// 获取广告信息
router.post('/api/advertisement', function(req, res, next) {
  pool.query('select  * from advertisement', function(err, rows, fields) {
    if (err){throw err;} 
    // 数据处理
    rows.map((item,index)=>{
      item.time = formateDate(item.time,"Y-M-D h:min:s")
    })
    res.send(rows)
  });
});
// 添加广告信息
router.post('/api/addadvertisement', function(req, res) {
  var form = new multiparty.Form();
  form.encoding = 'utf-8';        
  var ndate = new Date();
  var nstamp = ndate.getTime();
  var Y = ndate.getFullYear();
  var M = Number(ndate.getMonth())+1 < 10 ? "0"+ Number(ndate.getMonth()+1) : ndate.getMonth()+1;
  var D = ndate.getDate() < 10 ? "0"+ ndate.getDate() : ndate.getDate(); 
  var folderName = String(Y)+String(M)+String(D);   
  function doupload () {
      form.uploadDir = `upload/advertisement/${folderName}`;         //设置文件存储路径
      form.maxFilesSize = 2 * 1024 * 1024;        //设置单文件大小限制
      //form.maxFields = 1000;  设置所以文件的大小总和    对于多文件
      //上传完成后处理
      form.parse(req, function(err, fields, files) {
        var obj ={};
        var filesTmp = JSON.stringify(files,null,2);
        if(err){
          console.log('parse error: ' + err);
          res.json({status:400, message: '上传失败！'});
        }else{
          var inputFile = files.inputFile[0];
          var uploadedPath = inputFile.path;
          var fileFormat = (inputFile.originalFilename).split(".")[1];
          var dstPath = `./upload/advertisement/${folderName}/` + nstamp + "." + fileFormat;
          //重命名为真实文件名
          fs.rename(uploadedPath, dstPath, function(err) {
            if(err){
              console.log('rename error: ' + err);
              res.JSON({status:400, message: '上传失败！'});
            } else {
              var name = fields.name ? fields.name : -1;
              var sort = fields.sort ? fields.sort : -1;
              var type = fields.type ? fields.type : -1;
              var link = fields.link ? fields.link : -1;
              console.log('rename ok'); 
              pool.query(`INSERT INTO advertisement (name,type,sort,link,img) VALUES ('${name}','${type}','${sort}','${link}','${dstPath}')`,function(error, rows, fields){
                if(error){
                  res.json({status:399, message: '添加失败！'});
                }
                if(rows.affectedRows !== 1){
                  res.json({status:400, message: '添加失败！'});
                }else {
                  res.json({status:200, message: '添加成功！'});
                }
              })
            }
          });
        }
      });
  }
  fs.exists(`upload/advertisement/${folderName}`, function(exists) {
    if(!exists){
      fs.mkdirSync(`./upload/advertisement/${folderName}`)
      doupload ();
    }else{
      doupload ();
    }
  });
});
// 删除广告信息
router.post('/api/deladvertisement',function(req,res){
  var id = Number(req.body.id);
  pool.query(`DELETE FROM advertisement WHERE id=${id}`,function(error, rows, fields){
    if(error){
      res.json({status:399, message: '删除失败！'});
    }
    if(rows.affectedRows !== 1){
      res.json({status:400, message: '删除失败！'});
    }else {
      res.json({status:200, message: '删除成功！'});
    }
  })
});
// 修改广告信息
router.post('/api/editadvertisement', function(req, res) {
  var form = new multiparty.Form();
  form.encoding = 'utf-8';        
  var ndate = new Date();
  var nstamp = ndate.getTime();
  var Y = ndate.getFullYear();
  var M = Number(ndate.getMonth())+1 < 10 ? "0"+ Number(ndate.getMonth()+1) : ndate.getMonth()+1;
  var D = ndate.getDate() < 10 ? "0"+ ndate.getDate() : ndate.getDate(); 
  var folderName = String(Y)+String(M)+String(D);   
  function doupload () {
      form.uploadDir = `upload/advertisement/${folderName}`;         //设置文件存储路径
      form.maxFilesSize = 2 * 1024 * 1024;        //设置单文件大小限制
      //form.maxFields = 1000;  设置所以文件的大小总和    对于多文件
      //上传完成后处理
      form.parse(req, function(err, fields, files) {
        var obj ={};
        var filesTmp = JSON.stringify(files,null,2);
        if(err){
          console.log('parse error: ' + err);
          res.json({status:400, message: '上传失败！'});
        }else{
          var inputFile = files.editinputFile[0];
          var uploadedPath = inputFile.path;
          var fileFormat = (inputFile.originalFilename).split(".")[1];
          var dstPath = `./upload/advertisement/${folderName}/` + nstamp + "." + fileFormat;
          //重命名为真实文件名
          fs.rename(uploadedPath, dstPath, function(err) {
            if(err){
              console.log('rename error: ' + err);       
              res.JSON({status:400, message: '上传失败！'});
            } else {
              var id = fields.id ? fields.id : -1;
              var name = fields.name ? fields.name : -1;
              var sort = fields.sort ? fields.sort : -1;
              var type = fields.type ? fields.type : -1;
              var link = fields.link ? fields.link : -1;
              console.log('rename ok'); 
              pool.query(`UPDATE advertisement SET name='${name}',type='${type}',sort='${sort}',link='${link}',img='${dstPath}' WHERE id='${id}'`,function(error, rows, fields){
                if(error){
                  res.json({status:399, message: '更新失败！'});
                }
                if(rows.affectedRows !== 1){       
                  res.json({status:400, message: '更新失败！'});
                }else {
                  res.json({status:200, message: '更新成功！'});
                }
              })
            }
          });
        }
      });
  }
  fs.exists(`upload/advertisement/${folderName}`, function(exists) {
    if(!exists){
      fs.mkdirSync(`./upload/advertisement/${folderName}`)
      doupload ();
    }else{
      doupload ();
    }
  });
});


































// pool.query(`SELECT username FROM admin`,function(error, rows2, fields){
//   if(error){
//     console.log(error);
//     res.json({status:400, message: '验证失败！'});
//   }
//   if(rows2.indexOf(username) === -1){
//     res.json({status:400,message:"用户名不存在！"});
//   }else{
//     pool.query(`SELECT * FROM admin WHERE username='${username}'`,function(error, rows, fields){
//       if(error){console.log( error)};
//         console.log(rows)
//         res.json({status:200,message:"注册成功！",data:rows})  
//       });
//     }
// })
const USER_MAP = {
  super_admin: {
    name: 'super_admin',
    user_id: '1',
    access: ['super_admin', 'admin'],
    token: 'super_admin',
    avator: 'https://file.iviewui.com/dist/a0e88e83800f138b94d2414621bd9704.png'
  },
  admin: {
    name: 'admin',
    user_id: '2',
    access: ['admin'],
    token: 'admin',
    avator: 'https://avatars0.githubusercontent.com/u/20942571?s=460&v=4'
  }
}
router.post('/api/login',function(req,res,next){
  var username = req.body.userName,
      password = req.body.password;
      pool.query(`SELECT username FROM admin`,function(error, rows2, fields){
        if(error){console.log(error);}
        if(rows2.indexOf(username) === -1){
          pool.query(`SELECT * FROM admin WHERE username='${username}'`,function(error, rows, fields){
            if(error){console.log( error)};
            if(rows[0].password != password){
              res.json({status:402,message:"密码错误！"});
            }else{
              rows[0].token = rows[0].username;
              res.json({status:200,token: rows[0].token});
            }
          });
        }else{
          res.json({status:401,message:"用户名不存在！"});
          
        }
      })
})

router.get('/api/get_info',function(req,res,next){
  const params = getParams(req.url)
  res.json({status:200,token:USER_MAP[params.token]})
})

// 多功能表格 信息
router.get('/api/get_table_data',function(req,res,next){
  res.json({body:null,type:"GET",url:"http://localhost:3000/api/save_error_logger?token=admin"})
})

router.get('/api/save_error_logger',function(req,res,next){
  res.json({body:null,type:"GET",url:"http://localhost:3000/api/save_error_logger?token=admin"})
})
 
router.get('/api/message/count',function(req,res,next){
  res.json({data: 0,status: 200})
})


module.exports = router;
