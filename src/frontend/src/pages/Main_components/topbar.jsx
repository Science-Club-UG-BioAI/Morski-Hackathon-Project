

export default function Topbar({ changeTab, user, onLoginClick, onLogout }){
    return (
        <section className="topbar">
            <div className="topbar-content">
                <div className="topbar-left">
                    <div className="topbar-logo">
                        <div className="logo-image">
                            <div className="logo-text">
                                <span className="logo-subtitle">Larinae</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="topbar-right">
                    <nav className="topbar-nav">
                        <button onClick={()=> changeTab('home')}>{user ? "Panel" : "Home"}</button>
                        <button onClick={()=> changeTab('system')}>{user ? "Results" : "System"}</button>
                        <button onClick={()=> changeTab('help')}>{user ? "History" : "Help"}</button>
                        {user ? (
                            <>
                                <span className="topbar-user">{user.login}</span>
                                <button onClick={onLogout}>Log out</button>
                            </>
                        ) : (
                            <button onClick={onLoginClick}>Log in</button>
                        )}
                    </nav>
                </div>
            </div>
            <hr className="topbar-line"></hr>
        </section>
    );
}
