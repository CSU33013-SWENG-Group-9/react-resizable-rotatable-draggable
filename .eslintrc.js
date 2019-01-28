module.exports = {
  parser: "babel-eslint",
  extends: ["standard", "standard-react"],
  plugins: ["react"],
  rules: {
    "jsx-quotes": ["error", "prefer-double"],
    "no-shadow": 2,
    quotes: [2, "double"],
    semi: 0
  }
};
