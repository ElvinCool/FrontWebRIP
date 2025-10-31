import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Col, Image, Row, Spinner } from 'react-bootstrap'
import Breadcrumbs from '../components/Breadcrumbs'
import { fetchTruckById, type TruckItem } from '../modules/api'
import defaultImage from '/DefaultImage.jpg'
import './ServicePage.css'

function ServicePage() {
  const { id } = useParams()
  const [item, setItem] = useState<TruckItem | null>(null)

  useEffect(() => {
    if (!id) return
    fetchTruckById(id).then(setItem)
  }, [id])

  const img = item && item.imgUrl && item.imgUrl.trim().length > 0 ? item.imgUrl : defaultImage

  return (
    <div className="truck-details">
      <Breadcrumbs crumbs={[{ label: 'Грузовики', path: '/trucks' }, { label: item?.title || 'Грузовик' }]} />
      {!item ? (
        <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>
      ) : (
        <Row className="g-4 align-items-start">
          <Col lg={5}>
            <Image className="truck-picture" src={img} alt={item.title} width={480} height={320} />
          </Col>
          <Col lg={7}>
            <div className="truck-card mb-3">
              <h2 className="main-text">{item.title}</h2>
              <p className="truck-card-description">{item.description}</p>
            </div>
            <div className="more-card">
              <h2 className="more-main-text">Подробнее</h2>
              <ul className="more-card-list">
                <li className="more-card-list-item">📦 Грузоподъёмность: {item.weight ?? '—'} кг</li>
                <li className="more-card-list-item">💰 Стоимость: {item.price ?? '—'} ₽/км</li>
                <li className="more-card-list-item">🚛 Размеры: {item.length ?? '—'} × {item.width ?? '—'} × {item.height ?? '—'} м</li>
                <li className="more-card-list-item">🗓️ Год выпуска: {item.year ?? '—'}</li>
                <li className="more-card-list-item text-muted">Изображение (MinIO): {item.imgUrl || '—'}</li>
              </ul>
            </div>
          </Col>
        </Row>
      )}
    </div>
  )
}

export default ServicePage


