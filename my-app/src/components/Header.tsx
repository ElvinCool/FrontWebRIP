import { Link } from "react-router-dom";
import { ROUTES } from "../../Routes";
import "./Header.css";
import Logo from "../assets/logo.svg";

const Header = () => {
  return (
    <header className="trucks-header">
      <Link to={ROUTES.HOME} className="logo-link">
        <div className="logo-container">
          <img src={Logo} alt="logo" className="logitruck" />
        </div>
      </Link>
    </header>
  );
};

export default Header;

