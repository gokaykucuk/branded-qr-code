import l from 'loglevel';

import generate from './generate';

function defaultErrorFunction(req, res, err) {
  l.error(err.stack || new Error(err.error || err).stack);
  res.status(404).send('Not found');
}

export default function factoryQrRequest({
  text,
  getText = (req => req.query.t), // default text for the QRcode is in /?t=...
  getLogoPath,
  logoPath,
  getRatio,
  ignoreCache,
  qrOpt,
  maxAge = 31557600,
  onError = defaultErrorFunction,
} = {}) {
  return async function qrRequest(req, res) {
    const actualText = getText ? await getText(req) : text;
    const actualLogoPath = getLogoPath ? await getLogoPath(req) : logoPath;

    if (!actualText) {
      return (onError || defaultErrorFunction)(req, res, { error: 'NOTEXT' });
    }

    if (!actualLogoPath) {
      return (onError || defaultErrorFunction)(req, res, { error: 'NOLOGOPATH' });
    }

    return generate({
      text: actualText,
      path: actualLogoPath,
      ratio: getRatio ? await getRatio(req) : 2,
      opt: qrOpt,
      ignoreCache,
    }).then((imgBuffer) => {
      res.setHeader('Content-Type', 'image/png');
      if (maxAge !== false) res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
      res.send(imgBuffer);
    }).catch((err) => {
      (onError || defaultErrorFunction)(req, res, err);
    });
  };
}