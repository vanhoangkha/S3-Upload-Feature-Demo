import { useRef, useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { useNavigate } from "react-router-dom";
import Menu from "./component/Menu/Menu";
import Start from "./component/Home/Start";
import Home from "./component/Home/Home";
import Login from "./component/Authen/Login";
import Logout from "./component/Authen/Logout";
import Register from "./component/Authen/Register";
import Upload from "./component/Home/Upload";
import MyProfile from "./component/Profile/MyProfile";
import UpdateProfile from "./component/Profile/UpdateProfile";
import Document from "./component/Document/Document";
import DocumentDetail from "./component/Document/DocumentDetail";
//import TableDemo from "./component/Home/TableDemo"

import { Amplify, Auth } from "aws-amplify";
import awsconfig from "./aws-exports";
Amplify.configure(awsconfig);

function App() {
  // Get element menu-toggle and col-menu
  const menu_toggle = useRef(null);
  const col_menu = useRef(null);
  // to check close or open menu
  const [isCheckMenuItem, setIsCheckMenuItem] = useState(false);

  const [genInfor, setGenInfor] = useState({
    size: 0,
    amount: 0
  });
  const [currentUser, setCurrentUser] = useState();
  const [checkAuthen, setCheckAuthen] = useState(false);

  // Check if user logged or not
  useEffect(() => {
    let signinedUser = {
      username: "",
      id: "",
      identityId: ""
    }
    Auth.currentSession()
      .then((data) => {
        setCheckAuthen(true)
        signinedUser.username = data.idToken.payload["cognito:username"]
        signinedUser.id       = data.idToken.payload["sub"]
      })
      .catch((err) => {return});
      
    Auth.currentUserCredentials() 
      .then((data) => {
        if (data.accessKeyId){
          signinedUser.identityId =  data.identityId
        }
        else {
          return
        }
      })
      .catch((err) => console.log(err));
    
    setCurrentUser(signinedUser)
  }, []);

  // Responsive
  // Remove active class to close menu after select
  useEffect(() => {
    if (isCheckMenuItem) {
      menu_toggle.current.classList.remove("is-active");
      col_menu.current.classList.remove("is-active");
      setIsCheckMenuItem(false);
    }
  }, [isCheckMenuItem]);

  // Open menu when click hamb
  function openMenu(e) {
    menu_toggle.current.classList.toggle("is-active");
    col_menu.current.classList.toggle("is-active");
  }

  // User log out
  // async function logout() {
  //   await Auth.signOut();
  //   setCheckAuthen(false);
  //   navigate("/");
  // }

  return (
    <div className="App">
      {/* <div className="row"> */}
      {!checkAuthen && (
        <Router>
          <Routes>
            <Route exact path="/" element={<Start />}></Route>
            <Route exact path="/signin" element={<Login setCheckAuthen={setCheckAuthen} setCurrentUser={setCurrentUser}/>}
            ></Route>
            <Route exact path="/signup" element={<Register />}></Route>
          </Routes>
        </Router>
      )}
      {checkAuthen && (
        <Router>
          <div
            className="menu-toggle"
            ref={menu_toggle}
            onClick={(e) => openMenu()}
          >
            <div className="hamburger">
              <span></span>
            </div>
          </div>
          <div className="col-menu" ref={col_menu}>
            <Menu setIsCheckMenuItem={setIsCheckMenuItem}/>
          </div>
          <div className="col-content">
            <Routes>
              <Route exact path="/"         element={<Home user={currentUser} setGenInfor={setGenInfor} genInfor={genInfor}/>}></Route>
              <Route exact path="/upload"   element={<Upload user={currentUser} genInfor={genInfor} setGenInfor={setGenInfor}/>}></Route>
              <Route exact path="/profile"  element={<MyProfile user={currentUser} genInfor={genInfor}/>}></Route>
              <Route exact path="/logout"   element={<Logout setCheckAuthen={setCheckAuthen} />}></Route>
              <Route exact path="/profile/update" element={<UpdateProfile />}></Route>
              <Route exact path="/document" element={<Document user={currentUser} genInfor={genInfor} setGenInfor={setGenInfor}/>}></Route>
              <Route
                exact
                path="/document/detail/:name"
                element={<DocumentDetail username={currentUser.username}/>}
              ></Route>
            </Routes>
          </div>
        </Router>
      )}
    </div>
  );
}

export default App;
