# Жизненный цикл TrucksPage.tsx

## Обзор
`TrucksPage` - это функциональный React компонент, использующий хуки для управления состоянием и побочными эффектами. Компонент работает без Redux, используя только локальное состояние и API вызовы.

## Этапы жизненного цикла

### 1. Mounting Фаза (Фаза монтирования)

#### 1.1 Конструктор компонента (неявно)
В функциональных компонентах React конструктор отсутствует явно, но инициализация происходит при первом вызове функции компонента.

#### 1.2 Инициализация состояний
При первом рендере компонента инициализируются следующие состояния:

```typescript
// Состояние из URL параметров
const searchQueryFromUrl = searchParams.get("search") || ""

// Локальное состояние
const [searchValue, setSearchValue] = useState(searchQueryFromUrl)
const [trucks, setTrucks] = useState<TruckData[]>([])  // пустой массив грузовиков
const [cartCount, setCartCount] = useState<number>(0)  // количество в корзине
const [logistic, setLogistic] = useState<LogisticData | null>(null)  // данные черновика
```

**Инициализированные состояния:**
- `trucks: []` - пустой массив грузовиков
- `searchValue` - значение поискового запроса из URL
- `cartCount: 0` - количество грузовиков в корзине (изначально 0)
- `logistic: null` - данные черновика логистики (изначально null)

#### 1.3 Инициализация useCallback
```typescript
const refreshCart = useCallback(async () => {
  const data: LogisticData | null = await fetchDraftLogistic()
  setLogistic(data)
  if (!data) {
    setCartCount(0)
    return
  }
  const count = data.items.reduce((acc, item) => acc + (item.count ?? 1), 0)
  setCartCount(count)
}, [])
```

**Что происходит:**
- Создается мемоизированная функция `refreshCart`
- Функция загружает черновик логистики через API
- Обновляет состояние `logistic` и вычисляет `cartCount` из данных черновика

### 2. Render Фаза (Фаза рендеринга)

#### 2.1 Компонент возвращает JSX
Компонент выполняет рендер и возвращает JSX структуру.

#### 2.2 Отображение содержимого первого рендера
При первом рендере отображается:

- **Пустой массив грузовиков** - `trucks` еще не загружены, поэтому отображается пустая сетка
- **Корзина с логистиками** - `CartIndicator` с `count={0}` (изначально 0)
- **Поиск** - поле поиска `InputField` с возможностью ввода запроса
- **Хлебные крошки** - навигация (если присутствует в `Header`)

**Структура JSX:**
```typescript
<div className="trucks-page-wrapper">
  <Header />  // Хлебные крошки, навигация
  <CartIndicator count={cartCount} onClick={handleCartClick} />  // Корзина с логистиками
  <InputField 
    value={searchValue}
    setValue={setSearchValue}
    onSubmit={handleSearch}
  />  // Поиск
  <Row>  // Сетка грузовиков
    {filteredTrucks.map((truck) => (
      <TruckCard 
        onRequestClick={() => handleRequestClick(truck.id)}
        onImageClick={() => handleImageClick(truck.id)}
      />
    ))}
  </Row>
</div>
```

### 3. Pre-Commit Фаза (Фаза перед коммитом)

#### 3.1 React вычисляет какие изменения нужно внести в DOM
React анализирует виртуальный DOM и определяет, какие изменения необходимо применить к реальному DOM.

#### 3.2 Нет использования getSnapshotBeforeUpdate()
В функциональных компонентах нет метода `getSnapshotBeforeUpdate()`, который доступен только в классовых компонентах.

### 4. Commit Фаза (Фаза коммита)

#### 4.1 useEffect с зависимостями
После того, как React закоммитил изменения в DOM, выполняются эффекты.

#### 4.2 Load Trucks (Загрузка грузовиков)
```typescript
useEffect(() => {
  let isMounted = true
  
  getTrucksList()
    .then((data) => {
      if (isMounted) {
        setTrucks(data.results)  // Обновление состояния грузовиков
      }
    })
    .catch(() => {
      if (isMounted) {
        setTrucks([])
      }
    })
  
  refreshCart()  // Загрузка корзины вместе с грузовиками
  
  return () => {
    isMounted = false  // Cleanup функция
  }
}, [refreshCart])  // Зависимость от refreshCart
```

**Что происходит:**
- Выполняется асинхронный запрос `getTrucksList()` для загрузки списка грузовиков
- Одновременно вызывается `refreshCart()` для загрузки данных корзины
- При успехе обновляется состояние `trucks`
- Это вызывает повторный рендер с загруженными данными

#### 4.3 Load Cart (Загрузка корзины)
Функция `refreshCart()` выполняет следующие действия:

```typescript
const refreshCart = async () => {
  const data: LogisticData | null = await fetchDraftLogistic()
  setLogistic(data)
  if (!data) {
    setCartCount(0)
    return
  }
  const count = data.items.reduce((acc, item) => acc + (item.count ?? 1), 0)
  setCartCount(count)
}
```

**Что происходит:**
- Выполняется запрос `fetchDraftLogistic()` для получения черновика логистики
- Если черновик найден, обновляется состояние `logistic`
- Вычисляется количество элементов в корзине из `data.items`
- Обновляется состояние `cartCount`
- Если черновик не найден, `cartCount` устанавливается в 0

### 5. Updating Фаза (Фаза обновления)

#### 5.1 Обработка пользовательских событий
Компонент реагирует на действия пользователя через обработчики событий.

#### 5.2 handleSearch
```typescript
const handleSearch = () => {
  const trimmedValue = searchValue.trim()
  const newSearchParams = new URLSearchParams(searchParams)
  if (trimmedValue) {
    newSearchParams.set("search", trimmedValue)
  } else {
    newSearchParams.delete("search")
  }
  setSearchParams(newSearchParams, { replace: true })
}
```

**Триггер:** Нажатие кнопки "Найти грузовики"
**Действие:**
- Обновляет URL с параметром поиска
- Вызывает пересчет `filteredTrucks` через `useMemo` (при изменении `searchQueryFromUrl`)
- Вызывает повторный рендер с отфильтрованными данными

#### 5.3 Синхронизация с URL параметрами
```typescript
useEffect(() => {
  const urlSearch = searchParams.get("search") || ""
  setSearchValue(urlSearch)
}, [searchParamsString, searchParams])
```

**Когда выполняется:** При изменении URL параметров (например, при переходе через breadcrumbs или навигацию)
**Что делает:** Синхронизирует значение поля поиска с URL параметрами

#### 5.4 handleRequestClick
```typescript
const handleRequestClick = async (truckId: number) => {
  try {
    await addTruckToCart(truckId)
    await refreshCart()
    console.info("Грузовик добавлен в корзину")
  } catch (error) {
    console.error("Не удалось добавить грузовик", error)
  }
}
```

**Триггер:** Нажатие кнопки "Добавить в заявку" на карточке грузовика
**Действие:**
- Вызывает `addTruckToCart(truckId)` для добавления грузовика в корзину через API
- После успешного добавления вызывает `refreshCart()` для обновления состояния корзины
- Обновляет `cartCount` и `logistic` в состоянии компонента

#### 5.5 handleImageClick
```typescript
const handleImageClick = (truckId: number) => {
  const currentSearch = searchParams.get("search")
  const searchParam = currentSearch ? `?search=${encodeURIComponent(currentSearch)}` : ""
  navigate(`${ROUTES.ALBUMS}/${truckId}${searchParam}`)
}
```

**Триггер:** Клик по изображению грузовика
**Действие:** Переход на страницу деталей грузовика с сохранением параметра поиска в URL

#### 5.6 handleCartClick
```typescript
const handleCartClick = () => {
  if (logistic && !logistic.isMock) {
    window.location.href = `/logistic/${logistic.id}`
    return
  }
  navigate(ROUTES.LOGISTICS)
}
```

**Триггер:** Клик по индикатору корзины
**Действие:**
- Если есть реальный черновик (`logistic` существует и не является mock), переходит на страницу черновика через `window.location.href`
- Иначе переходит на общую страницу логистики через `navigate`

### 6. Unmounting Фаза (Фаза размонтирования)

#### 6.1 Cleanup функции useEffect
При размонтировании компонента выполняются cleanup функции из `useEffect`.

```typescript
// Cleanup из эффекта загрузки грузовиков
return () => {
  isMounted = false  // Предотвращает обновление состояния после размонтирования
}
```

**Что происходит:**
- Устанавливается флаг `isMounted = false`
- Если асинхронный запрос `getTrucksList()` или `refreshCart()` еще не завершился, обновление состояния будет проигнорировано
- Это предотвращает ошибки типа "Can't perform a React state update on an unmounted component"

#### 6.2 Удаление компонента из DOM
React удаляет компонент и все его дочерние элементы из DOM дерева.

#### 6.3 Освобождение из памяти
- Все локальные состояния (`useState`) удаляются:
  - `trucks`
  - `searchValue`
  - `cartCount`
  - `logistic`
- Мемоизированная функция `refreshCart` удаляется
- Обработчики событий удаляются
- Компонент готов к сборке мусора

## Диаграмма жизненного цикла

```
┌─────────────────────────────────────┐
│  1. Mounting Фаза                   │
│  • Конструктор (неявно)             │
│  • Инициализация состояний:         │
│    - trucks: []                     │
│    - searchValue                    │
│    - cartCount: 0                   │
│    - logistic: null                 │
│  • useCallback: refreshCart         │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  2. Render Фаза                     │
│  • Компонент возвращает JSX          │
│  • Отображение 1-го рендера:         │
│    - пустой массив грузовиков        │
│    - Корзина с логистиками (count=0) │
│    - Поиск                           │
│    - Хлебные крошки                  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  3. Pre-Commit Фаза                 │
│  • React вычисляет изменения для DOM│
│  • Нет getSnapshotBeforeUpdate()     │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  4. Commit Фаза                     │
│  • useEffect с [refreshCart]         │
│  • Load Trucks (getTrucksList)      │
│  • Load Cart (refreshCart)          │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  5. Updating Фаза                   │
│  • Обработка пользовательских событий│
│  • handleSearch                     │
│  • handleRequestClick               │
│  • handleImageClick                 │
│  • handleCartClick                  │
│  • Синхронизация с URL              │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  6. Unmounting Фаза                 │
│  • Cleanup функции useEffect         │
│  • Удаление компонента из DOM        │
│  • Освобождение из памяти            │
└─────────────────────────────────────┘
```

## Детальное описание useEffect

### useEffect #1: Загрузка грузовиков и корзины
```typescript
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
  
  refreshCart()
  
  return () => {
    isMounted = false
  }
}, [refreshCart])
```
- **Фаза:** Commit (после первого рендера и при изменении `refreshCart`)
- **Зависимости:** `[refreshCart]` (выполняется при монтировании и при изменении `refreshCart`)
- **Cleanup:** Да (предотвращение обновления после размонтирования)
- **Действие:** 
  - Загружает список грузовиков через API
  - Загружает данные корзины через `refreshCart()`

### useEffect #2: Синхронизация с URL
```typescript
useEffect(() => {
  const urlSearch = searchParams.get("search") || ""
  setSearchValue(urlSearch)
}, [searchParamsString, searchParams])
```
- **Фаза:** Updating (при изменении URL параметров)
- **Зависимости:** `[searchParamsString, searchParams]`
- **Cleanup:** Нет
- **Действие:** Синхронизирует значение поля поиска с URL параметрами

## Вычисляемые значения (useMemo)

### filteredTrucks
```typescript
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
```
- **Пересчитывается:** При изменении `searchQueryFromUrl`, `trucks`
- **Использование:** Фильтрует грузовики по поисковому запросу
- **Оптимизация:** Мемоизация предотвращает повторную фильтрацию при каждом рендере

## Мемоизированные функции (useCallback)

### refreshCart
```typescript
const refreshCart = useCallback(async () => {
  const data: LogisticData | null = await fetchDraftLogistic()
  setLogistic(data)
  if (!data) {
    setCartCount(0)
    return
  }
  const count = data.items.reduce((acc, item) => acc + (item.count ?? 1), 0)
  setCartCount(count)
}, [])
```
- **Зависимости:** `[]` (создается один раз при монтировании)
- **Использование:** 
  - Вызывается в `useEffect` при монтировании
  - Вызывается в `handleRequestClick` после добавления грузовика
- **Оптимизация:** Мемоизация предотвращает пересоздание функции при каждом рендере

## Особенности реализации

1. **Защита от утечек памяти:** Использование флага `isMounted` предотвращает обновление состояния после размонтирования
2. **Синхронизация с URL:** Компонент синхронизирует свое состояние с URL параметрами для поддержки навигации и закладок
3. **Локальное состояние:** Компонент не использует Redux, все состояние управляется локально через `useState`
4. **Мемоизация:** Использование `useMemo` для оптимизации фильтрации грузовиков и `useCallback` для мемоизации функции `refreshCart`
5. **Обработка ошибок:** Try-catch блоки в обработчиках событий для безопасной обработки ошибок API
6. **Условная навигация:** `handleCartClick` проверяет наличие реального черновика и использует разные способы навигации
7. **Отсутствие пагинации:** Все отфильтрованные грузовики отображаются сразу без разбиения на страницы

## Последовательность выполнения при монтировании

1. **Mounting:** 
   - Инициализация состояний (`trucks`, `searchValue`, `cartCount`, `logistic`)
   - Создание мемоизированной функции `refreshCart` через `useCallback`
2. **Render:** Первый рендер с пустыми данными
3. **Pre-Commit:** React вычисляет изменения для DOM
4. **Commit:** React применяет изменения к DOM
5. **Commit (useEffect):** Выполняется эффект с зависимостью `[refreshCart]`
   - Загрузка грузовиков (`getTrucksList()`)
   - Загрузка корзины (`refreshCart()` → `fetchDraftLogistic()`)
6. **Updating:** После загрузки данных происходит обновление состояния:
   - `setTrucks(data.results)`
   - `setLogistic(data)`
   - `setCartCount(count)`
7. **Render:** Повторный рендер с загруженными данными
8. **Commit:** React применяет обновления к DOM

## Последовательность выполнения при добавлении грузовика

1. **Событие:** Пользователь нажимает кнопку "Добавить в заявку"
2. **handleRequestClick:** Выполняется обработчик события
3. **API вызов:** `addTruckToCart(truckId)` добавляет грузовик в корзину
4. **Обновление корзины:** `refreshCart()` загружает обновленные данные корзины
5. **Обновление состояния:** 
   - `setLogistic(data)` - обновляет данные черновика
   - `setCartCount(count)` - обновляет количество в корзине
6. **Render:** Повторный рендер с обновленным `cartCount`
7. **Commit:** React применяет обновления к DOM (обновляется `CartIndicator`)
