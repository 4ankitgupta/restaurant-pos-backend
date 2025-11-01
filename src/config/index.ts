import dotenv from "dotenv";
dotenv.config();

const config = {
  port: process.env.PORT || 8000,
  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
    accessTokenExpire: process.env.ACCESS_TOKEN_EXPIRY!,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
    refreshTokenExpire: process.env.REFRESH_TOKEN_EXPIRY!,
    nodeEnv: process.env.NODE_ENV || "development",
    GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  },
};

export default config;
