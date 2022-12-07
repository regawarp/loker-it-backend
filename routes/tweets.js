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
function postTweet(imagePaths, caption) {
    let image_ids = []
    for (let i = 0; i < imagePaths.length; i++) {
        var image = require('fs').readFileSync(imagePaths[i]);
        twitterClient.post('media/upload', { media: image }, function (error, media, response) {
            if (!error) {
                // console.log(media);
                image_ids.push(media.media_id_string);
                if (image_ids.length == imagePaths.length) {
                    const status = {
                        status: caption,
                        media_ids: image_ids.join(','),
                    }
                    twitterClient.post('statuses/update', status, function (error, tweet, response) {
                        if (!error) {
                            // console.log(tweet);
                            return null;
                        }
                        else {
                            return error;
                        }
                    });
                }
            }
            else {
                return error;
            }
        });
    }
}

/* Post a Tweet. */
router.post('/', async function (req, res, next) {
    let imagePaths = [];
    for (let i = 0; i < req.body.images.length; i++) {
        const imagePath = 'posted_images/' + Date.now() + '.jpg';
        await downloadImage(req.body.images[i], imagePath).then(
            (result) => {
                imagePaths.push(imagePath);
            },
            (error) => {
                console.log('Error :', error);
                res.send('failed!');
                return;
            }
        );
    }

    const error = postTweet(imagePaths, req.body.caption);
    if (!error) res.send('success!');
    else res.send('failed!');
    return;
});

module.exports = router;
