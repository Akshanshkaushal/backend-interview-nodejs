import mongoose from "mongoose";

export const connectDb = async (url) => {
  try {
    const { connection } = await mongoose.connect(url);
    console.log(`database connected successfully at port ${connection.port}`);
  } catch (e) {
    console.log(`something went wrong in db connection`);
  }
};
