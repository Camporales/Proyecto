'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios from 'axios';

interface UserData {
    name: string;
    username: string;
    analyzedAt: Date;
}

const Historial: React.FC = () => {
    const [analyzedUsers, setAnalyzedUsers] = useState<UserData[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalyzedUsers = async () => {
            try {
                const response = await axios.get('/api/usuarios-analizados'); // Asegúrate de que esta URL sea correcta
                setAnalyzedUsers(response.data);
            } catch (error) {
                console.error('Error fetching analyzed users:', error);
                if (error instanceof Error) {
                    setError(`Error: ${error.message}`);
                } else {
                    setError('Ocurrió un error desconocido al obtener los datos.');
                }
            }
        };

        fetchAnalyzedUsers();
    }, []);

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Historial</CardTitle>
            </CardHeader>
            <CardContent>
                {error && <p className="text-red-500">{error}</p>}
                {analyzedUsers.length === 0 ? (
                    <p>No hay usuarios analizados en el historial.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Fecha de Análisis</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {analyzedUsers.map(user => (
                                <TableRow key={user.username}>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>@{user.username}</TableCell>
                                    <TableCell>{new Date(user.analyzedAt).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

export default Historial;
