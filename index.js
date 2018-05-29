const mpdRouter = require('express').Router();
const debug = require('debug')('mattermoster:mpd-plugin');

/**
 * POST /mpd
 */

mpdRouter.post('/', (req, res) => {
  const mmMpd = require('./mm-mpd');
  mmMpd.do(req.body).then(
    (result) => success(res, result),
    (err) => error(res, err)
  ).catch((err) => {
    error(res, err);
  })
});

function success(response, result) {
  debug(result);
  response.json(result);
}

function error(response, error) {
  debug(error);
  response.status(500).json({ msg: 'Something broke!'});
}

module.exports = mpdRouter;