import mongoos from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try{
        const connectionInstance = await mongoos.connect( `${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`MongoDB connected: chalgyaa:D-> ${connectionInstance.connection.host}`);
    }
    catch(er){
        console.log("Mongo phat gya xD ->",er);
        process.exit(1);
    }
}
export default connectDB