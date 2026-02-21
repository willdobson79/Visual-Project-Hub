const fs = require('fs');
const path = require('path');
const https = require('https');

const assetsDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

const placeholders = [
    { name: 'placeholder-workspace.jpg', url: 'https://placehold.co/1200x800/0f172a/white.jpg?text=Workspace' },
    { name: 'placeholder-board.jpg', url: 'https://placehold.co/1200x800/0f172a/white.jpg?text=Project+Board' },
    { name: 'placeholder-card.jpg', url: 'https://placehold.co/800x600/0f172a/white.jpg?text=Card+Detail' },
    { name: 'will-profile.jpg', url: 'https://placehold.co/600x800/0f172a/white.jpg?text=Will+Dobson' }
];

placeholders.forEach(asset => {
    const filePath = path.join(assetsDir, asset.name);
    if (!fs.existsSync(filePath)) {
        console.log(`Downloading ${asset.name}...`);
        const file = fs.createWriteStream(filePath);
        https.get(asset.url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${asset.name}`);
            });
        }).on('error', err => {
            fs.unlink(filePath);
            console.error(`Error downloading ${asset.name}: ${err.message}`);
        });
    } else {
        console.log(`${asset.name} already exists.`);
    }
});
