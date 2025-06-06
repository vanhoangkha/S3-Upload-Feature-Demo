import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "aws-amplify";
import {
  Container,
  Form,
  Header,
  SpaceBetween,
  Button,
  FormField,
  Input,
  Checkbox,
  Alert
} from '@cloudscape-design/components';

function Login(props) {
  const { setCheckAuthen, setCurrentUser } = props;
  const [unm, setUnm] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const redirectSignUpPage = () => {
    navigate("/signup");
  };
  
  async function signIn(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await Auth.signIn(unm, pwd);
      const user = await Auth.currentUserCredentials();
      setCheckAuthen(true);

      const session = await Auth.currentSession();
      const userInfor = {
        username: session.idToken.payload["cognito:username"],
        id: session.idToken.payload["sub"],
        identityId: user.identityId
      };
      setCurrentUser(userInfor);
      navigate("/");
    } catch (error) {
      console.log("Sign in fail: ", error);
      setError("Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Container>
      <Form
        header={<Header variant="h1">Login</Header>}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={redirectSignUpPage}>Sign up</Button>
            <Button variant="primary" onClick={signIn} loading={loading}>Sign in</Button>
          </SpaceBetween>
        }
      >
        {error && <Alert type="error">{error}</Alert>}
        
        <FormField label="Username">
          <Input
            value={unm}
            onChange={({ detail }) => setUnm(detail.value)}
            placeholder="Enter username"
          />
        </FormField>
        
        <FormField label="Password">
          <Input
            type="password"
            value={pwd}
            onChange={({ detail }) => setPwd(detail.value)}
            placeholder="Enter password"
          />
        </FormField>
        
        <Checkbox label="Remember me" />
      </Form>
    </Container>
  );
}

export default Login;
