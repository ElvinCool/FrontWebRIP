import React, { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Form, Button, Alert, Container } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { loginUserAsync, getCurrentUserAsync, clearError } from '../slices/userSlice';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { ROUTES } from '../../Routes';
import './LoginPage.css';

const LoginPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ login: '', password: '' });
    const error = useSelector((state: RootState) => state.user.error);
    const loading = useSelector((state: RootState) => state.user.loading);
    const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);

    useEffect(() => {
        if (isAuthenticated) {
            navigate(ROUTES.ALBUMS);
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (formData.login && formData.password) {
            try {
                await dispatch(loginUserAsync(formData)).unwrap();
                // После успешного логина получаем полные данные пользователя (включая isModerator)
                await dispatch(getCurrentUserAsync()).unwrap();
            } catch (err) {
                // Ошибка уже обработана в loginUserAsync
            }
        }
    };

    return (
        <div className="login-page-wrapper">
            <Header />
            <Container className="login-container">
                <div className="login-form-wrapper">
                    <h2 className="login-title">Рады снова Вас видеть!</h2>
                    {error && <Alert variant="danger" className="login-alert">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="login" className="login-form-group">
                            <Form.Label>Имя пользователя</Form.Label>
                            <Form.Control
                                type="text"
                                name="login"
                                value={formData.login}
                                onChange={handleChange}
                                placeholder="Введите имя пользователя"
                                required
                                disabled={loading}
                            />
                        </Form.Group>
                        <Form.Group controlId="password" className="login-form-group">
                            <Form.Label>Пароль</Form.Label>
                            <Form.Control
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Введите пароль"
                                required
                                disabled={loading}
                            />
                        </Form.Group>
                        <Button 
                            variant="primary" 
                            type="submit" 
                            className="login-submit-button"
                            disabled={loading}
                        >
                            {loading ? 'Вход...' : 'Войти'}
                        </Button>
                    </Form>
                    <div className="login-register-link">
                        <p>Нет аккаунта? <a href={ROUTES.REGISTER}>Зарегистрироваться</a></p>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default LoginPage;

