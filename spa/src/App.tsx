import './App.css'
import { Container, Nav, Navbar } from 'react-bootstrap'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ServicesPage from './pages/ServicesPage'
import ServicePage from './pages/ServicePage'

function App() {
  return (
    <BrowserRouter>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">LogiTruck</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">Главная</Nav.Link>
              <Nav.Link as={Link} to="/trucks">Грузовики</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container fluid className="py-3 px-3 px-md-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trucks" element={<ServicesPage />} />
          <Route path="/trucks/:id" element={<ServicePage />} />
        </Routes>
      </Container>
    </BrowserRouter>
  )
}

export default App
