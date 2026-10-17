import dotenv from 'dotenv'
dotenv.config()
import express from 'express';
import mongoose from 'mongoose';
import cors from "cors"
import categoryRouter from './routers/categoryRouter.js';
import roomRouter from './routers/roomRouter.js';
import productRouter from './routers/productRouter.js';
import cookieParser from "cookie-parser"
import cartRouter from './routers/cartRouter.js';
import userRouter from './routers/userRouter.js';
import orderRouter from './routers/orderRouter.js';
const server = express();

// use is middleware, request jb ati hai tb middleware se aati jati hai , 
// rquest ko validate , update, aage stop kar sakta hai
{/*cors: cross-origin resouce sharing is a security mechanism that controls
    whether a frontend from one origin can access resources
    from a backend on another origin */}
// return to pass json 
server.use(express.json());
server.use(cookieParser());
server.use(cors({ origin: ["http://localhost:3000", "http://127.0.0.1:3000"], credentials: true }));
server.use("/api/category", categoryRouter);
server.use("/api/room-type", roomRouter);
server.use("/api/product", productRouter);
server.use("/api/cart", cartRouter);
server.use("/api/user", userRouter);
server.use("/api/order", orderRouter);

mongoose.connect(process.env.DATABASE_URL).then(() => {
    console.log("DataBase connected")
    const port = Number(process.env.PORT) || 5000;
    server.listen(port, () => {
        console.log(`Server is running port number ${port}`)
    })


}).catch((error) => {
    console.error("Database connection failed:", error.message)
    process.exitCode = 1;
})
