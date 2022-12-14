const { imageHash } = require("image-hash");

// argument can be path to image, url to image, or object of buffer image, 
// for example: 
// "./public/media/image.png", 
// "https://www.gravatar.com/avatar/5010d337c197f7216ccfc838b78f6a7f?s=64&d=identicon&r=PG",
// { data: buffer }
function hashImage(arg) {
  return new Promise((resolve, reject) => {
    imageHash(arg, 16, true, (error, data) => {
      if (error) return reject(error);
      return resolve(data);
    });
  });
}

module.exports = { hashImage };

