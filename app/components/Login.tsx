import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); // Reiniciar el error antes de intentar iniciar sesión

        try {
            const response = await axios.post('/api/login', { username, password });
            localStorage.setItem('authToken', response.data.token); // Guarda el token en localStorage
            localStorage.setItem('userName', response.data.username); // Guarda el nombre de usuario
            router.push('/analizador'); // Redirige al analizador
        } catch (err) {
            // Manejo de errores más específico
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.message || 'Error al iniciar sesión. Verifica tus credenciales.');
            } else {
                setError('Error al iniciar sesión. Intenta de nuevo más tarde.');
            }
        }
    };

    return (
        <form onSubmit={handleLogin}>
            <input
                type="text"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required // Asegúrate de que el campo sea obligatorio
            />
            <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required // Asegúrate de que el campo sea obligatorio
            />
            <button type="submit">Iniciar sesión</button>
            {error && <p>{error}</p>}
        </form>
    );
};

export default Login; 