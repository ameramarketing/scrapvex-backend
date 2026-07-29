const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadLogo() {
  const url = 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Baba_Ghulam_Shah_Badshah_University_logo.png/220px-Baba_Ghulam_Shah_Badshah_University_logo.png';
  const destPath = path.join(__dirname, '..', 'dissertation_images', 'bgsbu_logo.png');

  // Make sure directory exists
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }

  console.log(`Downloading BGSBU logo to: ${destPath}`);
  
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  
  const writer = fs.createWriteStream(destPath);
  response.data.pipe(writer);
  
  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      console.log('BGSBU logo downloaded successfully!');
      resolve();
    });
    writer.on('error', (err) => {
      console.error('Writer error:', err);
      reject(err);
    });
  });
}

downloadLogo().catch(err => console.error('Axios download failed:', err.message));
