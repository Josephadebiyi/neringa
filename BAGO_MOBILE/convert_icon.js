const sharp = require('sharp');
const path = require('path');

const input = 'assets/images/logo.jpeg';
const output = 'assets/images/icon.png';

sharp(input)
    .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 88, g: 69, b: 216, alpha: 1 } // #5845D8 blue
    })
    .toFormat('png')
    .toFile(output)
    .then(() => console.log('Successfully created square PNG icon: ' + output))
    .catch(err => console.error('Error creating icon:', err));
