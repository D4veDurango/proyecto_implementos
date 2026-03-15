let mysql = require("mysql");
let conexion =  mysql.createConnection ({
    host:"localhost",
    database :"registro_usuarios",
    user: "root",
    password:"TuPassSegura123!",
});

conexion.connect(function(err) {

    if(err){
    
    throw err;
    
    }else
    
    console.log("conexion exitosa");
    
    });
