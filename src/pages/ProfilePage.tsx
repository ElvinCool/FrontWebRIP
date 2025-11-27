import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { getCurrentUserAsync, updateCurrentUserAsync } from '../slices/userSlice';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { ROUTES } from '../../Routes';
import { Form, Button, Alert, Container, Spinner } from 'react-bootstrap';
import './ProfilePage.css';

const ProfilePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { login, isAuthenticated } = useSelector((state: RootState) => state.user);
  const [formData, setFormData] = useState({ 
    currentPassword: '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    dispatch(getCurrentUserAsync());
  }, [dispatch, isAuthenticated, navigate]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(null);
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoadingUpdate(true);
    try {
      // В реальном приложении здесь должен быть API для смены пароля
      // Пока используем обновление пользователя
      await dispatch(updateCurrentUserAsync({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })).unwrap();
      
      setSuccess('Пароль успешно изменен');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err?.message || 'Ошибка при изменении пароля');
    } finally {
      setLoadingUpdate(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="profile-page">
      <Header />
      <Container className="profile-container">
        <h1 className="profile-title">Личный кабинет</h1>
        
        <div className="profile-section">
          <h2 className="profile-section-title">Информация о пользователе</h2>
          <div className="profile-info">
            <p><strong>Логин:</strong> {login}</p>
          </div>
        </div>

        <div className="profile-section">
          <h2 className="profile-section-title">Смена пароля</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handlePasswordChange}>
            <Form.Group controlId="currentPassword" className="profile-form-group">
              <Form.Label>Текущий пароль</Form.Label>
              <Form.Control
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Введите текущий пароль"
                required
                disabled={loadingUpdate}
              />
            </Form.Group>

            <Form.Group controlId="newPassword" className="profile-form-group">
              <Form.Label>Новый пароль</Form.Label>
              <Form.Control
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Введите новый пароль"
                required
                disabled={loadingUpdate}
                minLength={6}
              />
            </Form.Group>

            <Form.Group controlId="confirmPassword" className="profile-form-group">
              <Form.Label>Подтвердите новый пароль</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Повторите новый пароль"
                required
                disabled={loadingUpdate}
                isInvalid={formData.newPassword !== formData.confirmPassword && formData.confirmPassword !== ''}
              />
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              className="profile-submit-button"
              disabled={loadingUpdate}
            >
              {loadingUpdate ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Сохранение...
                </>
              ) : (
                'Изменить пароль'
              )}
            </Button>
          </Form>
        </div>
      </Container>
    </div>
  );
};

export default ProfilePage;

