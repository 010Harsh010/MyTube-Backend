import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import connectDB from "./db/index.js";
dotenv.config({ path: './.env' });
import {app} from "./app.js";


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running on port ${process.env.PORT || 8000}`)
    })
})
.catch((err) => {
    console.error("MOngo db connection failed ",err.message);
})








/*
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",()=>{
            console.log("ERROR:",error);
            throw error
        })
        app.listen(process.env.PORT ,()=>{
            console.log(`App listining on PORT ${process.env.PORT}}`);
            
        })
    } catch (error) {
        console.log("ERROR",error);
        throw error
    }
})()

*/