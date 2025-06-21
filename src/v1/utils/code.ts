// create a function to create otp of 6 characters
export const createOtp = () => {
  return Math.floor(100000 + Math.random() * 9000);
};

// create a function to create product code for new products consisting of 12 characters
export const createProductCode = () => {
  let code = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 12; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};
