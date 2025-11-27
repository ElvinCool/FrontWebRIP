import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { logoutUserAsync } from '../slices/userSlice';
import { ROUTES } from "../../Routes";
import "./Header.css";
import Logo from "../assets/logo.svg";
import { Button } from "react-bootstrap";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const username = useSelector((state: RootState) => state.user.login || state.user.username);

  const handleExit = async () => {
    await dispatch(logoutUserAsync());
    navigate(ROUTES.ALBUMS);
  };

  return (
    <header className="trucks-header">
      <Link to={ROUTES.HOME} className="logo-link">
        <div className="logo-container">
          <img src={Logo} alt="logo" className="logitruck" />
        </div>
      </Link>
      <div className="header-right">
        {isAuthenticated && username && (
          <Link to={ROUTES.PROFILE} className="header-username">
            {username}
          </Link>
        )}
        {!isAuthenticated ? (
          <>
            <Link to={ROUTES.LOGIN}>
              <Button className="header-login-btn">Войти</Button>
            </Link>
          </>
        ) : (
          <>
            <Link to={ROUTES.LOGISTICS_LIST}>
              <Button variant="outline-light" className="header-logistics-btn">
                Заявки
              </Button>
            </Link>
            <Button 
              variant="outline-light" 
              className="header-logout-btn" 
              onClick={handleExit}
            >
              Выйти
            </Button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;

