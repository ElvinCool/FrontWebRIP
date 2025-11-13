import "./TruckDetPage.css"
import BreadCrumbs from "../components/BreadCrumbs"
import { ROUTES } from "../../Routes"
import { useParams } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import Header from "../components/Header"
import defaultImage from "../assets/DefaultImage.png"
import { getTruckById } from "../modules/trucksApi"
import type { TruckData } from "../modules/getTruckById"

const formatNumber = (value?: number | null, suffix?: string) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return null
  }

  const formatted = value >= 1000 ? value.toLocaleString("ru-RU") : value.toString()
  return suffix ? `${formatted} ${suffix}` : formatted
}

const TruckDetPage = () => {
  const { id } = useParams<{ id: string }>()
  const truckId = Number(id)
  const [truckDetail, setTruckDetail] = useState<TruckData | null>(null)

  useEffect(() => {
    if (!Number.isFinite(truckId)) {
      setTruckDetail(null)
      return
    }

    getTruckById(truckId).then((data) => {
      setTruckDetail(data)
    })
  }, [truckId])

  const detailStats = useMemo(() => {
    if (!truckDetail) return []

    const dimensionParts = [
      formatNumber(truckDetail.length, "м"),
      formatNumber(truckDetail.width, "м"),
      formatNumber(truckDetail.height, "м"),
    ].map((part) => (part ? part.replace(/\sм$/, "") : null))

    const dimensionValue = dimensionParts.every((part) => part)
      ? `${dimensionParts[0]} × ${dimensionParts[1]} × ${dimensionParts[2]} м`
      : null

    const items = [
      {
        icon: "📦",
        label: "Грузоподъёмность",
        value: formatNumber(truckDetail.weight, "кг"),
      },
      {
        icon: "💸",
        label: "Стоимость",
        value: formatNumber(truckDetail.price, "₽"),
      },
      {
        icon: "📐",
        label: "Размеры",
        value: dimensionValue,
      },
      {
        icon: "🗓",
        label: "Год выпуска",
        value: truckDetail.year ? truckDetail.year.toString() : null,
      },
    ]

    return items.filter((item) => Boolean(item.value))
  }, [truckDetail])

  return (
    <div className="truck-det-page">
      <Header />

      <div className="truck-det-content">
        <div className="truck-det-breadcrumbs">
          <BreadCrumbs
            crumbs={[
              { label: "Грузовики", path: ROUTES.ALBUMS },
              { label: truckDetail?.title || "Грузовик" },
            ]}
          />
        </div>

        {truckDetail ? (
          <>
            <div className="truck-det-hero">
              <div className="truck-det-hero-image">
                <img src={(truckDetail.imgURL && truckDetail.imgURL.length > 0 ? truckDetail.imgURL : defaultImage)} alt={truckDetail.title} />
              </div>

              <div className="truck-det-description">
                <h1 className="truck-det-title">{truckDetail.title}</h1>
                <p className="truck-det-subtitle">{truckDetail.preview}</p>
                <p className="truck-det-text">{truckDetail.description}</p>
              </div>
            </div>

            <div className="truck-det-section">
              <h2 className="truck-det-section-title">Подробнее</h2>

              <div className="truck-det-stats">
                {detailStats.map((stat) => (
                  <div key={stat.label} className="truck-det-stat-card">
                    <div className="truck-det-stat-icon" aria-hidden>
                      {stat.icon}
                    </div>
                    <div className="truck-det-stat-info">
                      <span className="truck-det-stat-label">{stat.label}</span>
                      <span className="truck-det-stat-value">{stat.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="truck-det-empty">
            <p>К сожалению, данные по выбранному грузовику отсутствуют.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TruckDetPage