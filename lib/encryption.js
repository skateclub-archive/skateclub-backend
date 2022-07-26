const crypto = require('crypto');

const IV_LENGTH = 16 // For AES, this is always 16

module.exports.encrypt = function (text, key) {
  let iv = crypto.randomBytes(IV_LENGTH)
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv)
  let encrypted = cipher.update(text)

  encrypted = Buffer.concat([encrypted, cipher.final()])

  return iv.toString('hex') + ':' + encrypted.toString('hex')
}
