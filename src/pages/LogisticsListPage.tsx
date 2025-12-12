import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { getLogisticsListAsync, finalizeLogisticAsync, rejectLogisticAsync } from '../slices/logisticsSlice';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { ROUTES } from '../../Routes';
import { Table, Spinner, Alert, Container, Button, Form, Row, Col } from 'react-bootstrap';
import './LogisticsListPage.css';

const LogisticsListPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { logisticsList, loading, error } = useSelector((state: RootState) => state.logistics);
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const isModerator = useSelector((state: RootState) => state.user.isModerator);

  // Фильтры
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

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
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
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

      // Фильтр по статусу
      if (statusFilter !== 'all') {
        const statusStr = String(logistic.status || '').toLowerCase();
        const statusNum = logistic.status;
        
        let matchesStatus = false;
        if (statusFilter === 'сформирован') {
          matchesStatus = statusStr === 'сформирован' || statusStr === 'finalized' || statusNum === 2;
        } else if (statusFilter === 'завершен') {
          matchesStatus = statusStr === 'завершен' || statusStr === 'closed' || statusNum === 3;
        }
        
        if (!matchesStatus) {
          return false;
        }
      }

      // Фильтр по датам
      const dateCreate = logistic.date_create || logistic.dateCreate;
      if (dateFrom || dateTo) {
        const createDate = dateCreate ? new Date(dateCreate) : null;
        
        if (dateFrom) {
          const fromDate = parseDateFromRU(dateFrom);
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
        
        if (dateTo) {
          const toDate = parseDateFromRU(dateTo);
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
  }, [logisticsList, statusFilter, dateFrom, dateTo]);

  const handleRowClick = (id: number) => {
    navigate(`${ROUTES.LOGISTICS}/${id}`);
  };

  const handleFinalize = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите завершить эту заявку?')) {
      try {
        await dispatch(finalizeLogisticAsync(id)).unwrap();
        alert('Заявка успешно завершена!');
      } catch (error: any) {
        console.error('Ошибка при завершении заявки:', error);
        const errorMessage = error?.message || error || 'Неизвестная ошибка';
        alert(`Ошибка при завершении заявки: ${errorMessage}`);
      }
    }
  };

  const handleReject = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите отклонить эту заявку?')) {
      try {
        await dispatch(rejectLogisticAsync(id)).unwrap();
        alert('Заявка успешно отклонена!');
      } catch (error: any) {
        console.error('Ошибка при отклонении заявки:', error);
        const errorMessage = error?.message || error || 'Неизвестная ошибка';
        alert(`Ошибка при отклонении заявки: ${errorMessage}`);
      }
    }
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
        <div className="logistics-filters mb-4">
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Статус</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Все статусы</option>
                  <option value="сформирован">Сформирован</option>
                  <option value="завершен">Завершен</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Дата от (ДД.ММ.ГГГГ)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="ДД.ММ.ГГГГ"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Дата до (ДД.ММ.ГГГГ)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="ДД.ММ.ГГГГ"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
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
              <Table striped bordered hover className="logistics-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {isModerator && <th>Создатель</th>}
                    <th>Статус</th>
                    <th>Дата создания</th>
                    <th>Количество грузовиков</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogistics.map((logistic: any) => (
                    <tr 
                      key={logistic.id} 
                      onClick={() => handleRowClick(logistic.id)}
                      className="logistics-table-row"
                    >
                      <td>{logistic.id}</td>
                      {isModerator && (
                        <td>{logistic.creator?.name || logistic.creator?.login || 'Неизвестно'}</td>
                      )}
                      <td>
                        <span className={`status-badge ${getStatusClass(logistic.status)}`}>
                          {getStatusLabel(logistic.status)}
                        </span>
                      </td>
                      <td>
                        {formatDateToRU(logistic.date_create || logistic.dateCreate)}
                      </td>
                      <td>{logistic.items?.length || logistic.logistic_trucks?.length || 0}</td>
                      <td>
                        <div className="logistics-actions-group">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(logistic.id);
                            }}
                          >
                            Просмотреть
                          </Button>
                          {isModerator && (
                            <>
                              {/* Кнопки для заявок со статусом "сформирован" */}
                              {(() => {
                                const statusStr = String(logistic.status || '').toLowerCase();
                                const isFormed = statusStr === 'сформирован' || statusStr === 'finalized' || logistic.status === 2;
                                return isFormed ? (
                                  <>
                                    <Button
                                      variant="success"
                                      size="sm"
                                      onClick={(e) => handleFinalize(e, logistic.id)}
                                    >
                                      ✓ Завершить
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={(e) => handleReject(e, logistic.id)}
                                    >
                                      ✗ Отклонить
                                    </Button>
                                  </>
                                ) : null;
                              })()}
                            </>
                          )}
                        </div>
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

