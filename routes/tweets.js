var express = require('express');
var twitter = require('twitter');
var router = express.Router();

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
function postTweet(imagePath, caption) {
    var data = require('fs').readFileSync(imagePath);
    twitterClient.post('media/upload', { media: data }, function (error, media, response) {
        if (!error) {
            console.log(media);
            var status = {
                status: caption,
                media_ids: media.media_id_string + ',' + media.media_id_string
            }
            twitterClient.post('statuses/update', status, function (error, tweet, response) {
                if (!error) {
                    console.log(tweet);
                }
            });
        }
    });
}

/* Post a Tweet. */
router.post('/', async function (req, res, next) {
    const imagePath = 'posted_images/' + Date.now() + '.jpg';
    await downloadImage(req.body.image, imagePath).then(
        (result) => {
            postTweet(imagePath, req.body.caption);
            res.send('success!');
        },
        (error) => {
            console.log('Error :', error);
            res.send('failed!');
        }
    );
});

module.exports = router;
