import { Button } from "react-bootstrap";
import "./TruckCard.css";
import defaultImage from "../assets/DefaultImage.png";

interface TruckCardProps {
  image?: string | null;
  model: string;
  description?: string | null;
  onRequestClick: () => void;
  onImageClick?: () => void;
  isAuthenticated?: boolean;
  showAddButton?: boolean;
}

const TruckCard = ({
  image,
  model,
  description,
  onRequestClick,
  onImageClick,
  isAuthenticated = false,
  showAddButton = true,
}: TruckCardProps) => {
  const handleImageClick = () => {
    if (onImageClick) {
      onImageClick();
    }
  };

  const previewImage = image && image.trim().length > 0 ? image : defaultImage;
  const previewDescription = description && description.trim().length > 0 ? description : "Описание недоступно";

  return (
    <div className="truck-card">
      <div
        className="truck-card-image-container"
        onClick={handleImageClick}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleImageClick();
          }
        }}
      >
        <img src={previewImage} alt={model} className="truck-card-image" />
      </div>
      <div className="truck-card-content">
        <h3 className="truck-card-model">{model}</h3>
        <p className="truck-card-description">{previewDescription}</p>
        {showAddButton && (
          <Button 
            className="truck-card-button" 
            onClick={onRequestClick}
            disabled={!isAuthenticated}
          >
            {isAuthenticated ? "Добавить" : "Оставить заявку"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TruckCard;

