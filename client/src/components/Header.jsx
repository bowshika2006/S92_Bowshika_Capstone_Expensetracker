function Header({ user, onLogout }) {
  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label="Pennywise home">
        <span className="brand-mark" aria-hidden="true">p</span>
        <span>pennywise<span className="brand-period">.</span></span>
      </a>
      <div className="topbar-right">
        <span className="topbar-caption">Your personal money space</span>
        {user && (
          <div className="account-menu">
            <span className="user-avatar" aria-hidden="true">
              {user.name?.trim()?.[0]?.toUpperCase() || "U"}
            </span>
            <span className="user-name">{user.name}</span>
            <button className="logout-button" onClick={onLogout} type="button">
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
