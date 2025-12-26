import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { getLogisticsListAsync } from '../slices/logisticsSlice';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { ROUTES } from '../../Routes';
import { Table, Spinner, Alert, Container, Button, Form } from 'react-bootstrap';
import './LogisticsListPage.css';

const LogisticsListPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { logisticsList, loading, error } = useSelector((state: RootState) => state.logistics);
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const isModerator = useSelector((state: RootState) => state.user.isModerator);

  // Получаем сегодняшнюю дату в формате ДД.ММ.ГГГГ
  const getTodayDate = (): string => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Фильтры
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>(getTodayDate()); // Устанавливаем сегодняшнюю дату по умолчанию
  const [creatorFilter, setCreatorFilter] = useState<string>('all');
  const [appliedFilters, setAppliedFilters] = useState<{ status: string; dateFrom: string; dateTo: string; creator: string }>({
    status: 'all',
    dateFrom: '',
    dateTo: getTodayDate(), // Устанавливаем сегодняшнюю дату по умолчанию
    creator: 'all',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    dispatch(getLogisticsListAsync());
  }, [dispatch, isAuthenticated, navigate]);

  const getStatusLabel = (status: string | number | null | undefined) => {
    const statusStr = String(status || '').toLowerCase();
    if (statusStr === 'черновик' || statusStr === 'draft' || status === 1) return 'Черновик';
    if (statusStr === 'сформирован' || statusStr === 'finalized' || status === 2) return 'Сформирован';
    if (statusStr === 'завершен' || statusStr === 'closed' || status === 3) return 'Завершен';
    if (statusStr === 'отклонен' || statusStr === 'rejected' || status === 4) return 'Отклонен';
    return status || 'Неизвестно';
  };

  const getStatusClass = (status: string | number | null | undefined) => {
    const statusStr = String(status || '').toLowerCase();
    if (statusStr === 'черновик' || statusStr === 'draft' || status === 1) return 'status-draft';
    if (statusStr === 'сформирован' || statusStr === 'finalized' || status === 2) return 'status-finalized';
    if (statusStr === 'завершен' || statusStr === 'closed' || status === 3) return 'status-closed';
    if (statusStr === 'отклонен' || statusStr === 'rejected' || status === 4) return 'status-rejected';
    return '';
  };

  // Форматирование даты в формат РФ (ДД.ММ.ГГГГ)
  const formatDateToRU = (date: Date | string | null | undefined): string => {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Получение даты отправки (formed_at)
  const getFormedAt = (logistic: any): string => {
    // Для статуса "сформирован" или выше используем date_update как дату формирования
    const statusStr = String(logistic.status || '').toLowerCase();
    if (statusStr === 'сформирован' || statusStr === 'finalized' || statusStr === 'завершен' || statusStr === 'closed' || statusStr === 'отклонен' || statusStr === 'rejected') {
      return formatDateToRU(logistic.formed_at || logistic.date_update || logistic.dateUpdate);
    }
    return '—';
  };

  // Получение даты завершения (closed_at)
  const getClosedAt = (logistic: any): string => {
    // Только для статуса "завершен" или "отклонен"
    const statusStr = String(logistic.status || '').toLowerCase();
    if (statusStr === 'завершен' || statusStr === 'closed' || statusStr === 'отклонен' || statusStr === 'rejected') {
      return formatDateToRU(logistic.closed_at || logistic.date_finish || logistic.dateFinish);
    }
    return '—';
  };

  // Парсинг даты из формата РФ (ДД.ММ.ГГГГ)
  const parseDateFromRU = (dateStr: string): Date | null => {
    if (!dateStr || !dateStr.trim()) return null;
    const parts = dateStr.trim().split('.');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    const date = new Date(year, month, day);
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) return null;
    return date;
  };

  // Проверка, является ли заявка черновиком или отклоненной
  const isDraftOrRejected = (status: string | number | null | undefined): boolean => {
    const statusStr = String(status || '').toLowerCase();
    return statusStr === 'черновик' || statusStr === 'draft' || status === 1 ||
           statusStr === 'отклонен' || statusStr === 'rejected' || status === 4;
  };

  // Проверка, является ли создатель "бэк" или "фронт"
  const isBackOrFront = (creator: any): boolean => {
    if (!creator) return false;
    const login = (creator.login || creator.Login || '').toLowerCase();
    const name = (creator.name || creator.Name || '').toLowerCase();
    return login === 'бэк' || login === 'back' || login === 'фронт' || login === 'front' ||
           name === 'бэк' || name === 'back' || name === 'фронт' || name === 'front';
  };

  // Получение списка уникальных создателей для фильтра (только для модераторов)
  const uniqueCreators = useMemo(() => {
    if (!isModerator) return [];
    
    const creatorsMap = new Map<string, { id: number; name: string }>();
    logisticsList.forEach((logistic: any) => {
      const creator = logistic.creator;
      
      // Отладочная информация
      if (logistic.id && !creator) {
        console.log(`Logistic ${logistic.id} has no creator:`, logistic);
      }
      
      if (creator) {
        // Если creator - это объект
        if (typeof creator === 'object' && !isBackOrFront(creator)) {
          const creatorId = creator.id || creator.ID || creator.created_by_id || 0;
          const creatorName = creator.name || creator.login || creator.Name || creator.Login || creator.username || 'Неизвестно';
          
          if (creatorId > 0 && creatorName !== 'Неизвестно') {
            const key = String(creatorId);
            if (!creatorsMap.has(key)) {
              creatorsMap.set(key, { id: creatorId, name: creatorName });
              console.log(`Added creator to filter: id=${creatorId}, name=${creatorName}`);
            }
          } else {
            console.log(`Skipped creator (invalid id or name):`, creator);
          }
        }
        // Если creator - это строка или число (ID)
        else if (typeof creator === 'string' || typeof creator === 'number') {
          const creatorId = typeof creator === 'number' ? creator : parseInt(creator, 10);
          if (!isNaN(creatorId) && creatorId > 0) {
            const key = String(creatorId);
            if (!creatorsMap.has(key)) {
              creatorsMap.set(key, { id: creatorId, name: `Пользователь #${creatorId}` });
            }
          }
        }
      }
    });
    
    const result = Array.from(creatorsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    console.log('Unique creators for filter:', result);
    return result;
  }, [logisticsList, isModerator]);

  // Применение фильтров
  const handleApplyFilters = () => {
    setAppliedFilters({
      status: statusFilter,
      dateFrom: dateFrom,
      dateTo: dateTo,
      creator: creatorFilter,
    });
  };

  // Фильтрация заявок
  const filteredLogistics = useMemo(() => {
    return logisticsList.filter((logistic: any) => {
      // Исключаем черновики и отклоненные
      if (isDraftOrRejected(logistic.status)) {
        return false;
      }

      // Исключаем заявки от "бэк" и "фронт"
      if (isBackOrFront(logistic.creator)) {
        return false;
      }

      // Фильтр по статусу (используем примененные фильтры)
      if (appliedFilters.status !== 'all') {
        const statusStr = String(logistic.status || '').toLowerCase();
        const statusNum = logistic.status;
        
        let matchesStatus = false;
        if (appliedFilters.status === 'сформирован') {
          matchesStatus = statusStr === 'сформирован' || statusStr === 'finalized' || statusNum === 2;
        } else if (appliedFilters.status === 'завершен') {
          matchesStatus = statusStr === 'завершен' || statusStr === 'closed' || statusNum === 3;
        } else if (appliedFilters.status === 'отклонен') {
          matchesStatus = statusStr === 'отклонен' || statusStr === 'rejected' || statusNum === 4;
        }
        
        if (!matchesStatus) {
          return false;
        }
      }

      // Фильтр по создателю (только для модераторов)
      if (isModerator && appliedFilters.creator !== 'all') {
        const creatorId = appliedFilters.creator;
        const logisticCreatorId = logistic.creator?.id || logistic.creator?.ID || 0;
        if (String(logisticCreatorId) !== creatorId) {
          return false;
        }
      }

      // Фильтр по датам (используем примененные фильтры)
      const dateCreate = logistic.date_create || logistic.dateCreate || logistic.created_at;
      if (appliedFilters.dateFrom || appliedFilters.dateTo) {
        const createDate = dateCreate ? new Date(dateCreate) : null;
        
        if (appliedFilters.dateFrom) {
          const fromDate = parseDateFromRU(appliedFilters.dateFrom);
          if (fromDate && createDate) {
            fromDate.setHours(0, 0, 0, 0);
            const createDateStart = new Date(createDate);
            createDateStart.setHours(0, 0, 0, 0);
            if (createDateStart < fromDate) {
              return false;
            }
          } else if (fromDate && !createDate) {
            return false;
          }
        }
        
        if (appliedFilters.dateTo) {
          const toDate = parseDateFromRU(appliedFilters.dateTo);
          if (toDate && createDate) {
            toDate.setHours(23, 59, 59, 999);
            if (createDate > toDate) {
              return false;
            }
          } else if (toDate && !createDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [logisticsList, appliedFilters]);

  const handleRowClick = (id: number) => {
    navigate(`${ROUTES.LOGISTICS}/${id}`);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="logistics-list-page">
      <Header />
      <Container className="logistics-list-container">
        <h1 className="logistics-list-title">
          {isModerator ? 'Все заявки' : 'Мои заявки'}
        </h1>
        
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Фильтры */}
        <div className="logistics-filters-card">
          <div className="logistics-filters-content">
            <Form.Group className="logistics-filter-item">
              <Form.Label>Статус</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="logistics-filter-select"
              >
                <option value="all">Все статусы</option>
                <option value="сформирован">Сформирован</option>
                <option value="завершен">Завершен</option>
                <option value="отклонен">Отклонен</option>
              </Form.Select>
            </Form.Group>
            {isModerator && (
              <Form.Group className="logistics-filter-item">
                <Form.Label>Создатель</Form.Label>
                <Form.Select
                  value={creatorFilter}
                  onChange={(e) => setCreatorFilter(e.target.value)}
                  className="logistics-filter-select"
                >
                  <option value="all">Все создатели</option>
                  {uniqueCreators.map((creator) => (
                    <option key={creator.id} value={String(creator.id)}>
                      {creator.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
            <Form.Group className="logistics-filter-item">
              <Form.Label>Дата с</Form.Label>
              <div className="logistics-filter-date-wrapper">
                <Form.Control
                  type="text"
                  placeholder="дд.мм.гггг"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="logistics-filter-date"
                />
                <span className="logistics-filter-date-icon">📅</span>
              </div>
            </Form.Group>
            <Form.Group className="logistics-filter-item">
              <Form.Label>Дата по</Form.Label>
              <div className="logistics-filter-date-wrapper">
                <Form.Control
                  type="text"
                  placeholder="дд.мм.гггг"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="logistics-filter-date"
                />
                <span className="logistics-filter-date-icon">📅</span>
              </div>
            </Form.Group>
            <Button
              variant="primary"
              className="logistics-filter-apply-btn"
              onClick={handleApplyFilters}
            >
              Применить фильтры
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="logistics-list-loading">
            <Spinner animation="border" />
            <p>Загрузка заявок...</p>
          </div>
        ) : (
          <>
            {filteredLogistics.length === 0 ? (
              <Alert variant="info">
                {logisticsList.length === 0 
                  ? (isModerator ? 'Заявок пока нет' : 'У вас пока нет заявок')
                  : 'Заявки не найдены по заданным фильтрам'}
              </Alert>
            ) : (
              <Table className="logistics-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {isModerator && <th>Создатель</th>}
                    <th>Статус</th>
                    <th>Общая цена (₽)</th>
                    <th>Создана</th>
                    <th>Отправлена</th>
                    <th>Завершена</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogistics.map((logistic: any) => (
                    <tr 
                      key={logistic.id} 
                      className="logistics-table-row"
                    >
                      <td className="logistics-table-id">#{logistic.id}</td>
                      {isModerator && (
                        <td className="logistics-table-creator">
                          {(() => {
                            const creator = logistic.creator;
                            if (!creator) return 'Неизвестно';
                            if (typeof creator === 'object') {
                              return creator.name || creator.login || creator.Name || creator.Login || creator.username || 'Неизвестно';
                            }
                            if (typeof creator === 'string' || typeof creator === 'number') {
                              return `Пользователь #${creator}`;
                            }
                            return 'Неизвестно';
                          })()}
                        </td>
                      )}
                      <td>
                        <span className={`status-badge ${getStatusClass(logistic.status)}`}>
                          {getStatusLabel(logistic.status)}
                        </span>
                      </td>
                      <td className="logistics-table-price">
                        {logistic.total_price && logistic.total_price > 0 
                          ? Math.round(logistic.total_price).toLocaleString('ru-RU') 
                          : '0'}
                      </td>
                      <td className="logistics-table-date">
                        {formatDateToRU(logistic.created_at || logistic.date_create || logistic.dateCreate)}
                      </td>
                      <td className="logistics-table-date">
                        {getFormedAt(logistic)}
                      </td>
                      <td className="logistics-table-date">
                        {getClosedAt(logistic)}
                      </td>
                      <td className="logistics-table-actions">
                        <Button
                          variant="link"
                          className="logistics-view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(logistic.id);
                          }}
                        >
                          Просмотреть
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default LogisticsListPage;

