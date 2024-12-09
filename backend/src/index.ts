import express from "express"
import userRouter from "./routers/user";
import workerRouter from "./routers/worker";
import cors from "cors"

const app = express();

app.use(cors())


export const jwtSecret = "ormon"

app.use(express.json());

app.use("/v1/user", userRouter);
app.use("/v1/worker",workerRouter);


app.listen(4000, ()=>{
    console.log("Server is running on port 4000")
})