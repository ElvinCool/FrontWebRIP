import { Link } from "react-router-dom";
import { ROUTES } from "../../Routes";
import { Carousel } from "react-bootstrap";
import truck1 from "../assets/truck1.png";
import truck2 from "../assets/truck2.png";
import truck3 from "../assets/truck3.png";
import Header from "../components/Header";
import "./HomeLogisticPage.css";

const slides = [
  {
    img: truck1,
    title: "Безопасная доставка",
    text: "Ваш груз в надежных руках по всей стране",
  },
  {
    img: truck2,
    title: "Современная логистика",
    text: "Отслеживайте каждый этап доставки онлайн",
  },
  {
    img: truck3,
    title: "Своевременная доставка",
    text: "Мы ценим ваше время и гарантируем скорость",
  },
];

const HomePage = () => {
  return (
    <div className="home-page-container">
      <Header />
      <Carousel fade className="fullscreen-carousel">
        {slides.map((slide, idx) => (
          <Carousel.Item
            key={idx}
            as={Link}
            to={ROUTES.ALBUMS}
            className="fullscreen-carousel-item"
          >
            <img
              className="fullscreen-carousel-image"
              src={slide.img}
              alt={slide.title}
            />
            <Carousel.Caption className="fullscreen-carousel-caption">
              <h1 style={{ fontSize: "4rem" }}>LogiTruck</h1>
              <h3>{slide.title}</h3>
              <p>{slide.text}</p>
              <p style={{ fontStyle: "italic" }}>Нажмите на слайд, чтобы начать отслеживание</p>
            </Carousel.Caption>
          </Carousel.Item>
        ))}
      </Carousel>
    </div>
  );
};

export default HomePage;