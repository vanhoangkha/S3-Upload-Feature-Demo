export const APP_API_URL = "https://usivuxnmy4.execute-api.us-east-1.amazonaws.com/dev";

// Other constants
export const APP_NAME = "S3 Upload Feature Demo";
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = "*/*"; // All file types allowed

// Helper function to download files
export const downloadFile = (fileName, filePath) => {
  const link = document.createElement('a');
  link.href = filePath;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper function to check password validity
export const checkValidPwd = (pwd) => {
  const uppercaseRegExp = /(?=.*?[A-Z])/;
  const lowercaseRegExp = /(?=.*?[a-z])/;
  const digitsRegExp = /(?=.*?[0-9])/;
  const minLengthRegExp = /.{8,}/;
  const uppercasePassword = uppercaseRegExp.test(pwd);
  const lowercasePassword = lowercaseRegExp.test(pwd);
  const digitsPassword = digitsRegExp.test(pwd);
  const minLengthPassword = minLengthRegExp.test(pwd);
  
  if (!uppercasePassword) {
    return "At least one Uppercase";
  } else if (!lowercasePassword) {
    return "At least one Lowercase";
  } else if (!digitsPassword) {
    return "At least one digit";
  } else if (!minLengthPassword) {
    return "At least minimum 8 characters";
  }
  
  return "";
};
