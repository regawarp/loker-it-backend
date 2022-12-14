var twitter = require('twitter');
const fs = require('fs');
const Axios = require('axios');

require("dotenv").config();

const twitterClient = new twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

/* Download an Image from Given URL. */
async function downloadImage(imageUrl, filepath) {
    const response = await Axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(filepath))
            .on('finish', resolve)
            .on('error', reject);
    });
}

/* Post a Tweet with Given Image and Caption. */
async function postTweet(imagePaths, caption) {
    let image_ids = []
    // console.log(imagePaths);
    for (let i = 0; i < imagePaths.length; i++) {
        var image = require('fs').readFileSync(imagePaths[i]);
        const error = await twitterClient.post('media/upload', { media: image })
            .then(
                async media => {
                    // console.log(media);
                    image_ids.push(media.media_id_string);
                    if (image_ids.length == imagePaths.length) {
                        const status = {
                            status: caption,
                            media_ids: image_ids.join(','),
                        }
                        return await twitterClient.post('statuses/update', status)
                            .then(result => { return null; })
                            .catch(error => { console.log('Error :', error); return error; })
                    }
                })
            .catch(
                error => {
                    console.log('Error :', error);
                    return error;
                }
            )
        if (error) return error;
    }
}

/* Post a Tweet with Given Image Url and Caption. */
async function postTweetFromImageUrl(images = [], caption = '') {
    let imagePaths = [];
    for (let i = 0; i < images.length; i++) {
        const imagePath = 'posted_images/' + Date.now() + '.jpg';
        await downloadImage(images[i], imagePath).then(
            (result) => {
                imagePaths.push(imagePath);
            },
            (error) => {
                console.log('Error :', error);
                return error;
            }
        );
    }

    return await postTweet(imagePaths, caption);
}

module.exports = { downloadImage, postTweet, postTweetFromImageUrl }
