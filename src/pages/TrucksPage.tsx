import "./TrucksPage.css"
import { useEffect, useMemo, useState } from "react"
import { Row, Col } from "react-bootstrap"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useDispatch } from "react-redux"
import { ROUTES } from "../../Routes"
import Header from "../components/Header"
import InputField from "../components/InputField"
import TruckCard from "../components/TruckCard"
import CartIndicator from "../components/CartIndicator"
import { getTrucksList, addTruckToCart } from "../modules/trucksApi"
import { useCart, useCartItems, addTruckAction } from "../slices/cartSlice"
import type { TruckData } from "../modules/getTruckById"

const TrucksPage = () => {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  // Получаем значение поиска из URL напрямую
  const searchQueryFromUrl = searchParams.get("search") || ""
  const [searchValue, setSearchValue] = useState(searchQueryFromUrl)
  const [trucks, setTrucks] = useState<TruckData[]>([])
  const logistic = useCart()
  const cartItems = useCartItems()
  const cartCount = cartItems.reduce((acc, item) => acc + (item.count ?? 1), 0)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    getTrucksList()
      .then((data) => {
        if (isMounted) {
          setTrucks(data.results)
        }
      })
      .catch(() => {
        if (isMounted) {
          setTrucks([])
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Синхронизируем значение в поле ввода с URL при изменении URL (например, при переходе через breadcrumbs)
  // Используем строковое представление searchParams для правильного отслеживания изменений
  const searchParamsString = searchParams.toString()
  useEffect(() => {
    const urlSearch = searchParams.get("search") || ""
    setSearchValue(urlSearch)
  }, [searchParamsString, searchParams])

  const handleSearch = () => {
    const trimmedValue = searchValue.trim()
    // Обновляем URL с параметром поиска
    const newSearchParams = new URLSearchParams(searchParams)
    if (trimmedValue) {
      newSearchParams.set("search", trimmedValue)
    } else {
      newSearchParams.delete("search")
    }
    setSearchParams(newSearchParams, { replace: true })
  }

  const handleRequestClick = async (truckId: number) => {
    try {
      // Пытаемся добавить через API
      await addTruckToCart(truckId)
      // Также обновляем Redux store
      dispatch(addTruckAction(truckId))
      console.info("Грузовик добавлен в корзину")
    } catch (error) {
      // В случае ошибки API используем только Redux
      dispatch(addTruckAction(truckId))
      console.info("Грузовик добавлен в корзину (локально)")
    }
  }

  const handleImageClick = (truckId: number) => {
    // Сохраняем параметр поиска при переходе на страницу деталей
    const currentSearch = searchParams.get("search")
    const searchParam = currentSearch ? `?search=${encodeURIComponent(currentSearch)}` : ""
    navigate(`${ROUTES.ALBUMS}/${truckId}${searchParam}`)
  }

  const handleCartClick = () => {
    if (logistic && !logistic.isMock) {
      window.location.href = `/logistic/${logistic.id}`
      return
    }

    navigate(ROUTES.LOGISTICS)
  }

  const filteredTrucks = useMemo(() => {
    if (!searchQueryFromUrl) {
      return trucks
    }

    const normalizedQuery = searchQueryFromUrl.toLowerCase()

    return trucks.filter((truck) => {
      const title = truck.title?.toLowerCase() ?? ""
      const preview = truck.preview?.toLowerCase() ?? ""
      const description = truck.description?.toLowerCase() ?? ""
      return (
        title.includes(normalizedQuery) ||
        preview.includes(normalizedQuery) ||
        description.includes(normalizedQuery)
      )
    })
  }, [searchQueryFromUrl, trucks])

  return (
    <div className="trucks-page-wrapper">
      <div className="trucks-page">
        <Header />

        <div className="trucks-page-toolbar">
          <CartIndicator count={cartCount} onClick={handleCartClick} />
        </div>

        <div className="trucks-page-content">
          <div className="trucks-page-header">
            <h1 className="trucks-page-title">Наш автопарк грузовиков</h1>
            <p className="trucks-page-subtitle">
              Выбирайте из нашего ассортимента транспортных<br/> средств для ваших задач по доставке
            </p>
          </div>

          <div className="trucks-search-container">
            <div className="trucks-search-wrapper">
              <InputField
                value={searchValue}
                setValue={setSearchValue}
                onSubmit={handleSearch}
                placeholder="Поиск грузовиков"
                buttonTitle="Найти грузовики"
              />
            </div>
          </div>

          <Row xs={1} md={2} lg={3} className="g-4 trucks-grid">
            {filteredTrucks.map((truck) => (
              <Col key={truck.id}>
                <TruckCard
                  image={truck.imgURL}
                  model={truck.title}
                  description={truck.preview ?? truck.description}
                  onRequestClick={() => handleRequestClick(truck.id)}
                  onImageClick={() => handleImageClick(truck.id)}
                />
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </div>
  )
}

export default TrucksPage