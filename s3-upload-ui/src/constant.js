
import { Storage } from "aws-amplify";
import { useNavigate } from "react-router-dom";

export const APP_API_URL = "https://usivuxnmy4.execute-api.us-east-1.amazonaws.com/dev";
export const DEFAULT_REGION = "us-east-1";


export const BackPage = (prevPage) => {
  const navigate = useNavigate();

  const back = (prevPage) => {
    navigate(`/${prevPage}`);
  }

  return back
}

export const checkValidPwd = (pwd) => {
    let warningCheck = "";
    const uppercaseRegExp = /(?=.*?[A-Z])/;
    const lowercaseRegExp = /(?=.*?[a-z])/;
    const digitsRegExp = /(?=.*?[0-9])/;
    const minLengthRegExp = /.{8,}/;
    const uppercasePassword = uppercaseRegExp.test(pwd);
    const lowercasePassword = lowercaseRegExp.test(pwd);
    const digitsPassword = digitsRegExp.test(pwd);
    const minLengthPassword = minLengthRegExp.test(pwd);

    if (!uppercasePassword) {
      warningCheck = "At least one Uppercase";
    } else if (!lowercasePassword) {
      warningCheck = "At least one Lowercase";
    } else if (!digitsPassword) {
      warningCheck = "At least one digit";
    } else if (!minLengthPassword) {
      warningCheck = "At least minumum 8 characters";
    }

    return warningCheck;
}

export const downloadFile = async (name, path, identityId) => {
  try {
    // const response = await axios({
    //   method: "get",
    //   url: `${APP_API_URL}/docs/download/`,
    //   params: {
    //     object: path,
    //   },
    // });
    // const signed_url = response.data;
    // console.log(signed_url);

    console.log("object ", name);
    const signedURL = await Storage.get(
      name,
      { level: 'protected'}
    );
    console.log("signedURL ", signedURL)
    const link = document.createElement("a");
    // link.href = signed_url;
    link.href = signedURL;
    link.setAttribute("download", name);
    document.body.appendChild(link);
    link.click();
    
  } catch (error) {
    alert("Ops! Download fail!");
    console.log(error);
  }
};