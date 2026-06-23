import "./css/App.css";
import Topbar from "./pages/Main_components/topbar.jsx";
import LoginPanel from "./pages/Main_components/login.jsx";

import Home from './pages/home.jsx';
import System from "./pages/Tabs/system.jsx";
import Help from "./pages/Tabs/help.jsx"

import HomePriv from './pages/homePriv.jsx'
import FileLoad from './pages/Tabs/fileLoading.jsx'

import Footer from './pages/Main_components/footer.jsx';
import { useReducer, useState } from "react";

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);

  const handleChangeTab = (tabName) => {
    setActiveTab(tabName);
  };
  const handleLogin = (userData) => {
    setUser(userData);
    setShowLogin(false);
  };
  const handleLogout = () => {
    setUser(null);
    setActiveTab("home");
  };

  return (
    <div className="app">
      <Topbar changeTab={handleChangeTab} user={user} onLoginClick={() => setShowLogin(true)} onLogout={handleLogout}/>

      <main>
        {activeTab === 'home' && (user ? <HomePriv user={user}/>:<Home/>)}
        {activeTab === 'system' && (user ? <FileLoad />:<System/>)}
        {activeTab === 'help' && <Help/>}
      </main>
      <Footer/>

      {showLogin && (
        <LoginPanel
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
}

export default App;