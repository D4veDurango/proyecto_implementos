let mysql = require("mysql");
let conexion1 =  mysql.createConnection ({
    host:"localhost",
    database :"registro_usuarios",
    user: "root",
    password:"TuNuevaPass123!",
});

conexion.connect(function(err) {

    if(err){
        
    throw err;
    
    }else
    
    console.log("conexion exitosa");
    
    });
