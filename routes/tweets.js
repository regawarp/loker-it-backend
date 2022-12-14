var express = require('express');
var router = express.Router();
const tweets = require('../utility/tweets');

/* Post a Tweet. */
router.post('/', async function (req, res, next) {
    if(!req.body.images || req.body.images.length == 0) {
        res.send('please insert image!');
        return;
    }

    const error = await tweets.postTweetFromImageUrl(req.body.images, req.body.caption)
    if (!error) res.send('success!');
    else res.send('failed!');
    return;
});

module.exports = router;
