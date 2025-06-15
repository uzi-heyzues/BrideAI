const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

// Sample dress URLs (replace these with actual URLs from retail websites)
const dressUrls = [
    {
        url: 'https://example.com/dress1.JPG',
        filename: 'dress1.JPG'
    },
    {
        url: 'https://example.com/dress2.jpg',
        filename: 'dress2.jpg'
    },
    {
        url: 'https://example.com/dress3.jpg',
        filename: 'dress3.jpg'
    },
    {
        url: 'https://example.com/dress4.jpg',
        filename: 'dress4.jpg'
    }
];

// Function to download an image
async function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                return;
            }

            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
            });
        }).on('error', reject);
    });
}

// Main function to download all dresses
async function downloadDresses() {
    try {
        // Create images directory if it doesn't exist
        const imagesDir = path.join(__dirname, '..', 'public', 'images');
        await mkdirAsync(imagesDir, { recursive: true });

        console.log('Starting dress image downloads...');

        for (const dress of dressUrls) {
            try {
                console.log(`Downloading ${dress.filename}...`);
                const imageBuffer = await downloadImage(dress.url, dress.filename);
                await writeFileAsync(path.join(imagesDir, dress.filename), imageBuffer);
                console.log(`Successfully downloaded ${dress.filename}`);
            } catch (error) {
                console.error(`Error downloading ${dress.filename}:`, error.message);
            }
        }

        console.log('Download process completed!');
    } catch (error) {
        console.error('Error in download process:', error);
    }
}

// Run the download process
downloadDresses(); 