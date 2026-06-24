const app = require('./app')
const { sequelize } = require('./models')

require('dotenv').config()

const PORT = process.env.PORT || 3000

sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
  })
}).catch((error) => {
  console.error('Unable to sync database:', error);
  process.exit(1);
})
