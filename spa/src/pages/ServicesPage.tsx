import { useEffect, useState } from 'react'
import { Row, Col, Form, Button, Spinner } from 'react-bootstrap'
import Breadcrumbs from '../components/Breadcrumbs'
import ServiceCard from '../components/ServiceCard'
import { fetchTrucks, type TruckItem } from '../modules/api'
import './ServicesPage.css'

function ServicesPage() {
  const [title, setTitle] = useState('')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [yearFrom, setYearFrom] = useState<string>('')
  const [yearTo, setYearTo] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<TruckItem[]>([])

  const load = async () => {
    setLoading(true)
    const data = await fetchTrucks({
      title,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      yearFrom: yearFrom ? Number(yearFrom) : undefined,
      yearTo: yearTo ? Number(yearTo) : undefined,
    })
    setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="services-layout">
      <Breadcrumbs crumbs={[{ label: 'Грузовики', path: '/trucks' }]} />

      <Form className="filters-inline mb-3">
        <Row className="g-2 align-items-end">
          <Col md={4} lg={3}>
            <Form.Label className="mb-1">Название</Form.Label>
            <Form.Control placeholder="Напр. Volvo" value={title} onChange={e => setTitle(e.target.value)} />
          </Col>
          <Col xs={6} md={2} lg={2}>
            <Form.Label className="mb-1">Мин. цена</Form.Label>
            <Form.Control type="number" placeholder="от" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
          </Col>
          <Col xs={6} md={2} lg={2}>
            <Form.Label className="mb-1">Макс. цена</Form.Label>
            <Form.Control type="number" placeholder="до" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
          </Col>
          <Col xs={6} md={2} lg={2}>
            <Form.Label className="mb-1">Год от</Form.Label>
            <Form.Control type="number" placeholder="2018" value={yearFrom} onChange={e => setYearFrom(e.target.value)} />
          </Col>
          <Col xs={6} md={2} lg={2}>
            <Form.Label className="mb-1">Год до</Form.Label>
            <Form.Control type="number" placeholder="2025" value={yearTo} onChange={e => setYearTo(e.target.value)} />
          </Col>
          <Col xs={12} md={12} lg={1}>
            <Button className="w-100" onClick={load} disabled={loading}>Искать</Button>
          </Col>
        </Row>
      </Form>

      {loading ? (
        <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">Ничего не найдено</div>
      ) : (
        <div className="results-grid">
          {items.map(item => (
            <ServiceCard key={item.id} service={item} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ServicesPage


