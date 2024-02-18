import BACKEND_PORT from './config.json';
import Cookies from 'js-cookie';

export const apiRequest = (path, data, type, form = false) => {
  let useData = true;
  if (type === 'GET' || type === 'DELETE') useData = false;
  var formBody = [];
  if (form && useData) {
    for (var listing in data) {
      var encodedKey = encodeURIComponent(listing);
      var encodedValue = encodeURIComponent(data[listing]);
      formBody.push(encodedKey + '=' + encodedValue);
    }
    formBody = formBody.join('&');
  } else if (useData) {
    formBody = JSON.stringify(data);
  }
  const fetchOptions = {
    method: type,
    body: useData ? formBody : undefined,
    headers: {
      'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json',
      Authorization: 'Bearer ' + Cookies.get('token'),
    },
  };

  return new Promise((resolve, reject) => {
    fetch(`http://localhost:${BACKEND_PORT.BACKEND_PORT}/` + path, fetchOptions)
      .then((response) => {
        if (response.status !== 200) {
          response.json().then((error) => {
            reject(error);
          });
        } else {
          response.json().then((json) => {
            resolve(json);
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  });
};
