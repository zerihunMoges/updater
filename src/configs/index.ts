require('dotenv').config()
export const configs = {
  port: process.env.PORT || 3000,
  api: process.env.API
}
