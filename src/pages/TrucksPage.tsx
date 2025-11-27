import "./TrucksPage.css"
import { useEffect, useMemo, useState } from "react"
import { Row, Col, Pagination } from "react-bootstrap"
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

const ITEMS_PER_PAGE = 3 // Количество грузовиков на странице (уменьшено для демонстрации пагинации)

const TrucksPage = () => {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  // Получаем значение поиска из URL напрямую
  const searchQueryFromUrl = searchParams.get("search") || ""
  // Получаем номер страницы из URL
  const currentPageFromUrl = parseInt(searchParams.get("page") || "1", 10)
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
    // Проверяем валидность страницы из URL и корректируем при необходимости
    const pageFromUrl = parseInt(searchParams.get("page") || "1", 10)
    if (pageFromUrl !== currentPageFromUrl && pageFromUrl >= 1) {
      // Страница уже синхронизирована через currentPageFromUrl
    }
  }, [searchParamsString, searchParams, currentPageFromUrl])

  const handleSearch = () => {
    const trimmedValue = searchValue.trim()
    // Обновляем URL с параметром поиска и сбрасываем страницу на первую
    const newSearchParams = new URLSearchParams(searchParams)
    if (trimmedValue) {
      newSearchParams.set("search", trimmedValue)
    } else {
      newSearchParams.delete("search")
    }
    // При поиске сбрасываем на первую страницу
    newSearchParams.set("page", "1")
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

  // Пагинация
  const totalPages = Math.ceil(filteredTrucks.length / ITEMS_PER_PAGE)
  const currentPage = Math.max(1, Math.min(currentPageFromUrl, totalPages || 1))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedTrucks = filteredTrucks.slice(startIndex, endIndex)

  // Корректируем страницу, если она выходит за пределы после фильтрации
  useEffect(() => {
    if (totalPages > 0 && currentPageFromUrl > totalPages) {
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete("page")
      setSearchParams(newSearchParams, { replace: true })
    }
  }, [totalPages, currentPageFromUrl, searchParams, setSearchParams])

  const handlePageChange = (page: number) => {
    const newSearchParams = new URLSearchParams(searchParams)
    if (page === 1) {
      newSearchParams.delete("page")
    } else {
      newSearchParams.set("page", page.toString())
    }
    setSearchParams(newSearchParams, { replace: true })
    // Прокручиваем вверх при смене страницы
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

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
            {paginatedTrucks.length > 0 ? (
              paginatedTrucks.map((truck) => (
                <Col key={truck.id}>
                  <TruckCard
                    image={truck.imgURL}
                    model={truck.title}
                    description={truck.preview ?? truck.description}
                    onRequestClick={() => handleRequestClick(truck.id)}
                    onImageClick={() => handleImageClick(truck.id)}
                  />
                </Col>
              ))
            ) : (
              <Col xs={12}>
                <div className="trucks-empty-state">
                  <p>Грузовики не найдены</p>
                </div>
              </Col>
            )}
          </Row>

          {totalPages > 1 && (
            <div className="trucks-pagination-container">
              <Pagination className="trucks-pagination">
                <Pagination.First
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                />

                {/* Показываем номера страниц */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Показываем первую, последнюю, текущую и соседние страницы
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                  })
                  .map((page, index, array) => {
                    // Добавляем многоточие между разрывами
                    const showEllipsis = index > 0 && page - array[index - 1] > 1
                    return (
                      <span key={page}>
                        {showEllipsis && (
                          <Pagination.Ellipsis disabled />
                        )}
                        <Pagination.Item
                          active={page === currentPage}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Pagination.Item>
                      </span>
                    )
                  })}

                <Pagination.Next
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
              <div className="trucks-pagination-info">
                Показано {startIndex + 1}–{Math.min(endIndex, filteredTrucks.length)} из {filteredTrucks.length} грузовиков
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrucksPage