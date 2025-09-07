module.exports = {
  preset: 'react-scripts',
  moduleNameMapper: {
    '^react-router-dom$': '<rootDir>/node_modules/react-router-dom/dist/index.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-router-dom)/)'
  ],
  testEnvironment: 'jsdom',
};