import dotenv from "dotenv";
dotenv.config();

const config = {
  port: process.env.PORT || 8000,
  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
    accessTokenExpire: process.env.ACCESS_TOKEN_EXPIRY!,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
    refreshTokenExpire: process.env.REFRESH_TOKEN_EXPIRY!,
  },
};

export default config;
