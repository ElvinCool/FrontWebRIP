import type { KeyboardEvent } from "react";
import "./CartIndicator.css";
import busketIcon from "../assets/busket.svg";

interface CartIndicatorProps {
  count?: number;
  onClick?: () => void;
}

const CartIndicator = ({ count = 0, onClick }: CartIndicatorProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className="cart-indicator"
      role="button"
      tabIndex={0}
      aria-label="Корзина"
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <img src={busketIcon} alt="Корзина" className="cart-indicator-image" />
      {count > 0 && <span className="cart-indicator-badge">{count}</span>}
    </div>
  );
};

export default CartIndicator;
