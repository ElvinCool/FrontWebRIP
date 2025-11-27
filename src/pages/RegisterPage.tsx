import React, { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Form, Button, Alert, Container } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { registerUserAsync, clearError } from '../slices/userSlice';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { ROUTES } from '../../Routes';
import './RegisterPage.css';

const RegisterPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ login: '', password: '', confirmPassword: '' });
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
        if (formData.password !== formData.confirmPassword) {
            return;
        }
        if (formData.login && formData.password) {
            await dispatch(registerUserAsync({ login: formData.login, password: formData.password }));
        }
    };

    const passwordMatch = formData.password === formData.confirmPassword || formData.confirmPassword === '';

    return (
        <div className="register-page-wrapper">
            <Header />
            <Container className="register-container">
                <div className="register-form-wrapper">
                    <h2 className="register-title">Создать аккаунт</h2>
                    {error && <Alert variant="danger" className="register-alert">{error}</Alert>}
                    {!passwordMatch && formData.confirmPassword && (
                        <Alert variant="warning">Пароли не совпадают</Alert>
                    )}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="login" className="register-form-group">
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
                        <Form.Group controlId="password" className="register-form-group">
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
                        <Form.Group controlId="confirmPassword" className="register-form-group">
                            <Form.Label>Подтвердите пароль</Form.Label>
                            <Form.Control
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Повторите пароль"
                                required
                                disabled={loading}
                                isInvalid={!passwordMatch && formData.confirmPassword !== ''}
                            />
                        </Form.Group>
                        <Button 
                            variant="primary" 
                            type="submit" 
                            className="register-submit-button"
                            disabled={loading || !passwordMatch}
                        >
                            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                        </Button>
                    </Form>
                    <div className="register-login-link">
                        <p>Уже есть аккаунт? <a href={ROUTES.LOGIN}>Войти</a></p>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default RegisterPage;

