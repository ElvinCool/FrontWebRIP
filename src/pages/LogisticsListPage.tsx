import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { getLogisticsListAsync, finalizeLogisticAsync, rejectLogisticAsync } from '../slices/logisticsSlice';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { ROUTES } from '../../Routes';
import { Table, Spinner, Alert, Container, Button } from 'react-bootstrap';
import './LogisticsListPage.css';

const LogisticsListPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { logisticsList, loading, error } = useSelector((state: RootState) => state.logistics);
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const isModerator = useSelector((state: RootState) => state.user.isModerator);

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

        {loading ? (
          <div className="logistics-list-loading">
            <Spinner animation="border" />
            <p>Загрузка заявок...</p>
          </div>
        ) : (
          <>
            {logisticsList.length === 0 ? (
              <Alert variant="info">
                {isModerator ? 'Заявок пока нет' : 'У вас пока нет заявок'}
              </Alert>
            ) : (
              <Table striped bordered hover className="logistics-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {isModerator && <th>Создатель</th>}
                    <th>Статус</th>
                    <th>Количество грузовиков</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {logisticsList.map((logistic: any) => (
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

