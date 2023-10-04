import mongoose from 'mongoose';

let isConnected = false; //variable to track the connection status


export const connectToDB= async () => {
    mongoose.set('strictQuery', true);

    if(!process.env.MONGO_URL) return console.log('MongoDB URL not found');

    if(isConnected) return console.log('=> using existing database connection');

    try{
        await mongoose.connect(process.env. MONGO_URL);
        isConnected = true;

        console.log('MongoDB is connected');

    }catch(error){
        console.log(error)
    }
}