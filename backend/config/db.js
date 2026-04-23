import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect("mongodb+srv://shivamabhangi118:jqcwr3Zy4TF1rqgQ@cluster0.r0gue.mongodb.net/Quickcart?retryWrites=true&w=majority&appName=Cluster0");
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};