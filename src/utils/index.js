import { Buffer } from 'buffer';
// import crypto from 'crypto';
// import log from './logger.js';

const tokenPropertyKey = 'token';

const fetchToken = async (httpClient, atlassianAccountId) => {
  return new Promise((resolve, reject) => {
    // log.info(`fetchToken for: ${atlassianAccountId}`);

    httpClient.asUserByAccountId(atlassianAccountId).get(
      {
        url: `/rest/api/2/user/properties/${tokenPropertyKey}?accountId=${atlassianAccountId}`,
        headers: {
          Accept: 'application/json',
        },
      },
      function (err, _, body) {
        if (err) {
          // log.error("Failed on reading user property 'token'", err);
          reject(err);
          return;
        }

        const response = JSON.parse(body);
        const token = ((response.value || {}).value || {}).token || '';
        resolve(token);
      }
    );
  });
};

const saveToken = async (httpClient, atlassianAccountId, token) => {
  // log.info(`fetchToken for: ${atlassianAccountId}`);

  return new Promise((resolve, reject) => {
    const requestOpt = {
      url: `/rest/api/2/user/properties/${tokenPropertyKey}?accountId=${atlassianAccountId}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: { token } }),
    };

    httpClient
      .asUserByAccountId(atlassianAccountId)
      .put(requestOpt, (err, res, body) => {
        if (err || res.statusCode > 399) {
          // log.error(`error of first attemt to save token: ${res.statusCode}`);
          // log.error(err);

          // log.info('second attemt to save token: ');
          httpClient
            .asUserByAccountId(atlassianAccountId)
            .post(requestOpt, (err2, res2, body2) => {
              if (err2 || res2.statusCode !== 200) {
                log.error('Failed on saving user property token: ', err2);
                log.error(err2);
                return reject(err);
              }
            });
        }
        resolve(token);
      });
  });
};

const getEncodedSHA256Hash = async (str) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert buffer to byte array
  const hashString = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Convert hex string to Base64
  function hexToBase64(hexString) {
    const binaryString = hexString
      .match(/.{1,2}/g)
      .map((byte) => String.fromCharCode(parseInt(byte, 16)))
      .join('');
    return btoa(binaryString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  return hexToBase64(hashString);
};

//////////// JIRA
const getJiraIssueProperty = async (httpClient, issueKey, propertyKey) => {
  return new Promise((resolve, reject) => {
    const requestOpt = {
      url: `/rest/api/2/issue/${issueKey}/properties/${propertyKey}`,
      headers: {
        Accept: 'application/json',
      },
    };

    httpClient.get(requestOpt, (err, res, body) => {
      if (err) {
        // log.error('get chart error');
        // log.error(err);
        return reject(err);
      }

      const diagrams = JSON.parse(body);
      const propertyValue = diagrams['value'];
      let charts;

      try {
        let parsedValue = JSON.parse(propertyValue);
        charts = parsedValue.value;
      } catch (e) {
        // log.error('error_charts: ', e);
        charts = [];
      }
      resolve(charts);
    });
  });
};

const setJiraIssueProperty = async (
  httpClient,
  issueKey,
  propertyKey,
  value
) => {
  return new Promise((resolve, reject) => {
    const requestOpt = {
      url: `/rest/api/2/issue/${issueKey}/properties/${propertyKey}`,
      json: true,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    };

    httpClient.put(requestOpt, (err, res, body) => {
      if (err) {
        // log.error('set chart error');
        // log.error(err);
        return reject(err);
      }

      resolve([]);
    });
  });
};

const getJiraIssueAttachment = async (httpClient, issueKey, attachmentId) => {
  return new Promise((resolve, reject) => {
    const requestOpt = {
      url: `/rest/api/2/attachment/${attachmentId}`,
      headers: {
        Accept: 'application/json',
      },
    };

    httpClient.get(requestOpt, (err, res, body) => {
      if (err) {
        // log.error('get chart error', err);
        return reject(err);
      }

      const attachment = body; //JSON.parse(body);
      resolve(attachment);
    });
  });
};

const setJiraIssueAttachment = async (httpClient, issueKey, fileData) => {
  return new Promise((resolve, reject) => {
    const requestOpt = {
      url: `/rest/api/2/issue/${issueKey}/attachments`,
      json: true,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Atlassian-Token': 'nocheck',
      },
      formData: {
        file: {
          value: fileData,
          options: {
            filename: `${issueKey}-attachment.png`,
            contentType: 'image/x-png',
          },
        },
      },
    };

    httpClient.post(requestOpt, (err, res, body) => {
      if (err) {
        // log.info(`Set attachment error`, err);
      }

      if (res && res.statusCode && res.statusCode > 399) {
        // log.info(`Set attachment res ${res.statusCode} ${res.statusMessage}`);
        return reject(err);
      }
      resolve(body);
    });
  });
};

const deleteJiraIssueAttachment = async (
  httpClient,
  issueKey,
  attachmentId
) => {
  return new Promise((resolve, reject) => {
    const requestOpt = {
      url: `/rest/api/2/attachment/${attachmentId}`,
      headers: {
        'X-Atlassian-Token': 'nocheck',
      },
    };

    httpClient.del(requestOpt, (err, res, body) => {
      if (err) {
        // log.error('delete chart error', err);
        return reject(err);
      }

      resolve(true);
    });
  });
};

function base64ToArrayBuffer(base64) {
  var binaryString = atob(base64);
  const buffer = Buffer.alloc(binaryString.length);

  for (var i = 0; i < binaryString.length; i++) {
    buffer[i] = binaryString.charCodeAt(i);
  }
  return buffer;
}

export {
  fetchToken,
  saveToken,
  getEncodedSHA256Hash,
  getJiraIssueProperty,
  setJiraIssueProperty,
  getJiraIssueAttachment,
  setJiraIssueAttachment,
  deleteJiraIssueAttachment,
  base64ToArrayBuffer,
};
