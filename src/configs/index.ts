require('dotenv').config()
export const configs = {
  port: process.env.PORT || 3000,
  api: process.env.API,
  apiTokens: [
    process.env.CLUB0,
    process.env.CLUB1,
    process.env.CLUB2,
    process.env.CLUB3,
    process.env.CLUB4,
    process.env.CLUB5,
    process.env.CLUB6,
    process.env.CLUB7,
    process.env.CLUB8,
    process.env.CLUB9
  ]
}
