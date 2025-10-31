import { Container, Row, Col, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <Container fluid className="py-4 px-3 px-md-4">
      <Row className="g-4">
        <Col xs={12} className="text-start">
          <h1 className="mb-3">Главная</h1>
          <p className="lead">
            Это стартовая страница SPA. Перейдите к разделу «Грузовики», чтобы посмотреть доступные предложения и воспользоваться фильтрами.
          </p>
          <Button as={Link} to="/trucks" variant="primary">К списку грузовиков</Button>
        </Col>
      </Row>
    </Container>
  )
}

export default HomePage


