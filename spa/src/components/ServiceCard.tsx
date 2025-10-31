import { Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import type { TruckItem } from '../modules/api'
import defaultImage from '/DefaultImage.jpg'

function ServiceCard({ service }: { service: TruckItem }) {
  const img = service.imgUrl && service.imgUrl.trim().length > 0 ? service.imgUrl : defaultImage
  return (
    <Card className="h-100 shadow-sm">
      <Card.Img variant="top" src={img} style={{ objectFit: 'cover', height: 200 }} />
      <Card.Body>
        <Card.Title>{service.title}</Card.Title>
        <Card.Text>
          Цена: {service.price ?? '—'} ₽ {service.year ? `• Год: ${service.year}` : ''}
        </Card.Text>
        <Link to={`/trucks/${service.id}`} className="btn btn-primary w-100">Подробнее</Link>
      </Card.Body>
    </Card>
  )
}

export default ServiceCard


