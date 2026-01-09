const axios = require('axios')

const API = process.env.NEXT_PUBLIC_API_URL || 'https://zinoshop.onrender.com'
const TIMEOUT = 10000

async function check() {
  try {
    const res = await axios.get(`${API}/api/health`, { timeout: TIMEOUT })
    console.log(`OK: ${API}/api/health -> ${res.status} ${res.statusText}`)
    process.exit(0)
  } catch (err) {
    if (err.response) {
      console.error(`ERROR: ${API}/api/health -> ${err.response.status} ${err.response.statusText}`)
    } else if (err.code === 'ECONNABORTED') {
      console.error(`ERROR: request timed out after ${TIMEOUT}ms`)
    } else {
      console.error('ERROR:', err.message)
    }
    process.exit(2)
  }
}

check()
