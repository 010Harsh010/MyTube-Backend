import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import connectDB from "./db/index.js";
dotenv.config({ path: './.env' });


const app = express();

const whitelist = ['http://localhost:5173','https://mytube-beta-version.vercel.app','https://mytube-beta-version.vercel.app/login','https://mytube-beta-version.vercel.app/','https://mytube-beta-version.vercel.app/setting'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, 
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import subscriptionRouter from "./routes/subsription.routes.js";
import commentsRouter from "./routes/comments.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import likeRouter from "./routes/like.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/comments", commentsRouter);
app.use("/api/v1/user-playlist", playlistRouter);
app.use("/api/v1/likes", likeRouter);

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