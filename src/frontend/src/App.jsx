import "./css/App.css";
import Topbar from "./pages/Main_components/topbar.jsx";
import LoginPanel from "./pages/Main_components/login.jsx";

import Home from './pages/home.jsx';
import System from "./pages/Tabs/system.jsx";
import Help from "./pages/Tabs/help.jsx"

import ResultsPriv from './pages/resultsPriv.jsx'
import FileLoad from './pages/Tabs/fileLoading.jsx'
import History from "./pages/Tabs/history.jsx";

import Footer from './pages/Main_components/footer.jsx';
import { useReducer, useState } from "react";

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [resultData, setResultData] = useState(null);

  const handleChangeTab = (tabName) => {
    setActiveTab(tabName);
  };
  const handleLogin = (userData) => {
    setUser(userData);
    setShowLogin(false);
    setActiveTab("home");
  };
  const handleLogout = () => {
    setUser(null);
    setResultData(null);
    setShowLogin(false);
    setActiveTab("home");
  };
  const handleResultData = (data) => {
    setResultData(data);
    setActiveTab("system");
  };


  return (
    <div className="app">
      <Topbar changeTab={handleChangeTab} user={user} onLoginClick={() => setShowLogin(true)} onLogout={handleLogout}/>

      <main>
        {activeTab === 'home' && (user ? <FileLoad onResult={handleResultData} />:<Home/>)}
        {activeTab === 'system' && (user ? <ResultsPriv user={user} resultData={resultData}/>:<System/>)}
        {activeTab === 'help' && (user ? <History />:<Help/>)}
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