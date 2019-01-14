/* 导入mysql模块 */
var mysql = require('mysql');
var pool = mysql.createPool({
  host:'localhost',
  port     : 3306,    // 数据库连接的端口号 默认是3306  
  database : 'iview', // 需要查询的数据库  
  user     : 'root',  // 用户名  
  password : 'root'   // 密码，我的密码是空。所以是空字符串  
});                   // 使用DBConfig.js的配置信息创建一个MySQL连接池
var query=function(sql,callback){
  pool.getConnection(function(err,conn){
   if(err){
    callback(err,null,null);
   }else{
    conn.query(sql,function(qerr,vals,fields){
     //释放连接
     conn.release();
     //事件驱动回调
     callback(qerr,vals,fields);
    });
   }
  });
 };
 module.exports=query;