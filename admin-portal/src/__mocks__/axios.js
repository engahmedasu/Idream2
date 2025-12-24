// Manual mock for axios
const axios = jest.fn(() => Promise.resolve({ data: {} }));

axios.create = jest.fn(() => axios);
axios.get = jest.fn(() => Promise.resolve({ data: {} }));
axios.post = jest.fn(() => Promise.resolve({ data: {} }));
axios.put = jest.fn(() => Promise.resolve({ data: {} }));
axios.patch = jest.fn(() => Promise.resolve({ data: {} }));
axios.delete = jest.fn(() => Promise.resolve({ data: {} }));
axios.request = jest.fn(() => Promise.resolve({ data: {} }));
axios.head = jest.fn(() => Promise.resolve({ data: {} }));
axios.options = jest.fn(() => Promise.resolve({ data: {} }));

// Interceptors
axios.interceptors = {
  request: {
    use: jest.fn(),
    eject: jest.fn(),
  },
  response: {
    use: jest.fn(),
    eject: jest.fn(),
  },
};

// Cancel token and other utilities
axios.Cancel = jest.fn();
axios.CancelToken = jest.fn();
axios.isCancel = jest.fn();
axios.all = jest.fn((promises) => Promise.all(promises));
axios.spread = jest.fn((callback) => (arr) => callback(...arr));

module.exports = axios;
module.exports.default = axios;

