const app = require("./src/app");
const http = require("http");
const Server = http.createServer(app) ; // here create server using app module

const PORT = process.env.PORT ||9000;

//running on port
Server.listen(PORT,()=>{
    console.log(`listening on: http://localhost:${PORT}`);
})