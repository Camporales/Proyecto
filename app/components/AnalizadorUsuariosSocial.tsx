'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin, Calendar, X , Download, InfoIcon } from "lucide-react"
import axios from 'axios'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { ThemeToggle } from './ThemeToggle'
import Historial from './Historial';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface UserData {
  name: string;
  username: string;
  profileImage: string;
  followers: number;
  following: number;
  location: string;
  joinDate: string;
  posts: number;
  likes: number;
  listed: number;
  description: string;
  verified: boolean;
  reposts: number;
  mediaCount: number;
  mentions: number;
  analyzedAt: Date; // Nueva propiedad para almacenar la fecha y hora del análisis
  verifiedType: string;
}

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

const extractUsername = (url: string): string => {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/(?:#!\/)?@?([^\/\?\s#]+)/);
  return match ? match[1] : '';
};

const fetchXData = async (url: string): Promise<UserData> => {
  const username = extractUsername(url);
  if (!username) {
    throw new Error('URL de X inválida');
  }

  try {
    const response = await axios.get(`/api/x/${username}`);
    const data = response.data;
    
    console.log('Datos recibidos de la API:', data); // Para depuración

    const publicMetrics = data.public_metrics || {};

    return {
      name: data.name || 'No disponible',
      username: data.username || 'No disponible',
      profileImage: data.profile_image_url || '',
      followers: publicMetrics.followers_count || 0,
      following: publicMetrics.following_count || 0,
      location: data.location || 'No disponible',
      joinDate: data.created_at || 'No disponible',
      posts: publicMetrics.tweet_count || 0,
      likes: publicMetrics.like_count || 0,
      listed: publicMetrics.listed_count || 0,
      description: data.description || 'No disponible',
      verified: data.verified || false,
      verifiedType: data.verified_type || 'none',
      reposts: publicMetrics.retweet_count || 0,
      mediaCount: publicMetrics.media_count || 0,
      mentions: publicMetrics.mention_count || 0,
      analyzedAt: new Date()
    };
  } catch (error) {
    console.error('Error fetching X data:', error);
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      throw new Error('Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde.');
    }
    throw error;
  }
};

const analyzeUser = (userData: UserData): { botProbability: number, analysis: string, metrics: any } => {
  let botScore = 0;
  const totalFactors = 7;

  // Factor 1: Ratio seguidores/siguiendo
  const followRatio = userData.followers / userData.following;
  if (followRatio < 0.01) botScore += 1;
  else if (followRatio > 100) botScore += 0.5;

  // Factor 2: Antigüedad de la cuenta
  const accountAge = (new Date().getTime() - new Date(userData.joinDate).getTime()) / (1000 * 3600 * 24);
  if (accountAge < 30) botScore += 1;

  // Factor 3: Frecuencia de posts
  const postsPerDay = userData.posts / accountAge;
  if (postsPerDay > 50) botScore += 1;
  else if (postsPerDay > 20) botScore += 0.5;

  // Factor 4: Porcentaje de reposts (si está disponible)
  const repostPercentage = userData.posts > 0 ? (userData.reposts / userData.posts) * 100 : 0;
  if (repostPercentage > 80) botScore += 1;
  else if (repostPercentage > 60) botScore += 0.5;

  // Factor 5: Interacción con otros usuarios (si está disponible)
  const interactionRate = userData.posts > 0 ? (userData.mentions / userData.posts) * 100 : 0;
  if (interactionRate < 5) botScore += 1;
  else if (interactionRate < 10) botScore += 0.5;

  // Factor 6: Perfil verificado
  if (userData.verified) {
    botScore -= 1; // Reducimos la probabilidad de bot para cuentas verificadas
    if (userData.verifiedType === 'blue') {
      botScore -= 0.25; // Reducimos un poco más para cuentas con verificación azul
    } else {
      botScore -= 0.5; // Reducimos aún más para otros tipos de verificación (gobierno, empresa, etc.)
    }
  }

  // Factor 7: Engagement (en lugar de likes por post)
  const engagementRate = userData.followers > 0 ? 
    ((userData.likes + userData.reposts) / userData.followers) * 100 : 0;
  if (engagementRate < 0.1) botScore += 1;
  else if (engagementRate < 1) botScore += 0.5;
  else if (engagementRate > 10) botScore -= 0.5;

  const botProbability = (botScore / totalFactors) * 100;

  let analysis = "";
  if (botProbability < 25) analysis = "Muy probablemente un usuario real";
  else if (botProbability < 50) analysis = "Probablemente un usuario real";
  else if (botProbability < 75) analysis = "Posiblemente un bot";
  else analysis = "Muy probablemente un bot";

  const metrics = {
    followRatio,
    accountAge,
    postsPerDay,
    repostPercentage,
    interactionRate,
    verified: userData.verified,
    verifiedType: userData.verifiedType,
    engagementRate
  };

  return { botProbability, analysis, metrics };
};

const renderMetricPieChart = (value: number, label: string, color: string) => {
  const data = [
    { name: label, value: value },
    { name: 'Resto', value: 100 - value }
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill={color}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={index === 0 ? color : '#f3f4f6'}
              strokeWidth={index === 0 ? 2 : 0}
            />
          ))}
        </Pie>
        <text 
          x="50%" 
          y="50%" 
          textAnchor="middle" 
          dominantBaseline="middle" 
          className="text-2xl font-bold fill-black dark:fill-white"
        >
          {`${value.toFixed(0)}%`}
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
};

interface AnalizadorUsuariosSocialProps {
  onLogout: () => void;
}

function AnalizadorUsuariosSocial({ onLogout }: AnalizadorUsuariosSocialProps) {
  const router = useRouter();
  const [url, setUrl] = useState('')
  const [analyzedUsers, setAnalyzedUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [comparisonUsers, setComparisonUsers] = useState<UserData[]>([])
  const reportRef = useRef<HTMLDivElement>(null)
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login'); // Redirigir si no hay token
    } else {
      fetchCurrentUser(); // Llamar a la función para obtener el usuario
    }
  }, [router]);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await axios.get('/api/usuario', {
        headers: {
          Authorization: token
        }
      });
      setCurrentUser(response.data.username); // Establecer el nombre de usuario
    } catch (error) {
      if (error.response && error.response.status === 401) {
        router.push('/login'); // Redirigir si el token es inválido
      } else {
        console.error('Error fetching user data:', error);
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchXData(url)
      setAnalyzedUsers(prevUsers => {
        const userExists = prevUsers.some(user => user.username === data.username)
        if (userExists) {
          return prevUsers.map(user => user.username === data.username ? data : user)
        } else {
          return [...prevUsers, data]
        }
      })
      setUrl('')
    } catch (error) {
      console.error('Error fetching user data:', error)
      if (error instanceof Error) {
        setError(`Error: ${error.message}`)
      } else {
        setError('Ocurrió un error desconocido al obtener los datos del usuario. Por favor, inténtalo de nuevo más tarde.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSelect = (username: string) => {
    const user = analyzedUsers.find(u => u.username === username);
    if (user) {
      setSelectedUser(user);
      setIsDropdownOpen(false);
      
      setComparisonUsers(prev => {
        const userExists = prev.some(u => u.username === username);
        if (userExists) {
          return prev.filter(u => u.username !== username);
        } else {
          if (prev.length < 2) {
            const user = analyzedUsers.find(u => u.username === username);
            if (user) {
              return [...prev, user];
            }
          }
          return prev;
        }
      });
    }
  };

  const compareUsers = () => {
    if (comparisonUsers.length !== 2) return null

    const [user1, user2] = comparisonUsers
    const analysis1 = analyzeUser(user1)
    const analysis2 = analyzeUser(user2)

    const realUser = analysis1.botProbability < analysis2.botProbability ? user1 : user2
    const botUser = analysis1.botProbability < analysis2.botProbability ? user2 : user1

    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Comparación de usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Basado en nuestro análisis:</p>
          <p className="font-semibold text-green-600">
            {realUser.name} (@{realUser.username}) es más probable que sea un usuario real.
          </p>
          <p className="font-semibold text-red-600 mt-2">
            {botUser.name} (@{botUser.username}) es más probable que sea un bot.
          </p>
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Métrica</TableHead>
                <TableHead>{user1.name}</TableHead>
                <TableHead>{user2.name}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Probabilidad de ser bot</TableCell>
                <TableCell>{analysis1.botProbability.toFixed(2)}%</TableCell>
                <TableCell>{analysis2.botProbability.toFixed(2)}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Ratio seguidores/siguiendo</TableCell>
                <TableCell>{(user1.followers / user1.following).toFixed(2)}</TableCell>
                <TableCell>{(user2.followers / user2.following).toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Posts por día</TableCell>
                <TableCell>{(user1.posts / ((new Date().getTime() - new Date(user1.joinDate).getTime()) / (1000 * 3600 * 24))).toFixed(2)}</TableCell>
                <TableCell>{(user2.posts / ((new Date().getTime() - new Date(user2.joinDate).getTime()) / (1000 * 3600 * 24))).toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Porcentaje de reposts</TableCell>
                <TableCell>{((user1.reposts / user1.posts) * 100).toFixed(2)}%</TableCell>
                <TableCell>{((user2.reposts / user2.posts) * 100).toFixed(2)}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tasa de interacción (menciones/posts)</TableCell>
                <TableCell>{((user1.mentions / user1.posts) * 100).toFixed(2)}%</TableCell>
                <TableCell>{((user2.mentions / user2.posts) * 100).toFixed(2)}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Likes por post</TableCell>
                <TableCell>{(user1.likes / user1.posts).toFixed(2)}</TableCell>
                <TableCell>{(user2.likes / user2.posts).toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Antigüedad de la cuenta (días)</TableCell>
                <TableCell>{((new Date().getTime() - new Date(user1.joinDate).getTime()) / (1000 * 3600 * 24)).toFixed(0)}</TableCell>
                <TableCell>{((new Date().getTime() - new Date(user2.joinDate).getTime()) / (1000 * 3600 * 24)).toFixed(0)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Verificado</TableCell>
                <TableCell>{user1.verified ? "Sí" : "No"}</TableCell>
                <TableCell>{user2.verified ? "Sí" : "No"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  const generatePDF = async () => {
    if (reportRef.current && selectedUser) {
      const canvas = await html2canvas(reportRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Generamos un nombre de archivo seguro basado en el nombre de usuario
      const safeUsername = selectedUser.username.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `reporte_analisis_${safeUsername}.pdf`;

      pdf.save(fileName);
    }
  };

  const averageUserMetrics = {
    followRatio: 1.2,
    accountAge: 730, // 2 años en días
    postsPerDay: 3,
    repostPercentage: 30,
    interactionRate: 15,
    verifiedPercentage: 0.1, // 0.1% de usuarios verificados
    likesPerPost: 20 // Ajustado a un valor más realista para cuentas populares
  };

  const InfoTooltip = ({ content }: { content: string }) => (
    <div className="group relative inline-block">
      <InfoIcon className="h-4 w-4 ml-1 cursor-help" />
      <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded p-2 
                      -mt-2 -ml-32 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {content}
      </div>
    </div>
  );

  const renderUserInfo = (data: UserData) => {
    const { botProbability, analysis, metrics } = analyzeUser(data);

    const activityData = [
      { name: 'Posts', value: data.posts },
      { name: 'Reposts', value: data.reposts },
      { name: 'Menciones', value: data.mentions },
      { name: 'Me gusta', value: data.likes },
    ];

    const metricas = [
      {
        nombre: "Ratio seguidores/siguiendo",
        descripcion: "Esta métrica indica la proporción entre seguidores y seguidos. Un ratio muy bajo o muy alto puede ser indicativo de un bot.",
        valorUsuario: metrics.followRatio.toFixed(2),
        valorPromedio: averageUserMetrics.followRatio.toFixed(2),
        interpretacion: interpretFollowRatio(metrics.followRatio)
      },
      {
        nombre: "Antigüedad de la cuenta (días)",
        descripcion: "La edad de la cuenta puede indicar su legitimidad. Cuentas muy nuevas tienen mayor probabilidad de ser bots.",
        valorUsuario: metrics.accountAge.toFixed(0),
        valorPromedio: averageUserMetrics.accountAge,
        interpretacion: interpretAccountAge(metrics.accountAge)
      },
      {
        nombre: "Posts por día",
        descripcion: "Una frecuencia de posts muy alta puede ser indicativa de actividad automatizada.",
        valorUsuario: metrics.postsPerDay.toFixed(2),
        valorPromedio: averageUserMetrics.postsPerDay,
        interpretacion: interpretPostsPerDay(metrics.postsPerDay)
      },
      {
        nombre: "Porcentaje de reposts",
        descripcion: "Un alto porcentaje de reposts en comparación con posts originales puede indicar comportamiento de bot.",
        valorUsuario: metrics.repostPercentage.toFixed(2) + "%",
        valorPromedio: averageUserMetrics.repostPercentage + "%",
        interpretacion: interpretRepostPercentage(metrics.repostPercentage)
      },
      {
        nombre: "Tasa de interacción (menciones/posts)",
        descripcion: "Una baja tasa de interacción puede indicar comportamiento automatizado o falta de engagement genuino.",
        valorUsuario: metrics.interactionRate.toFixed(2) + "%",
        valorPromedio: averageUserMetrics.interactionRate + "%",
        interpretacion: interpretInteractionRate(metrics.interactionRate)
      },
      {
        nombre: "Estado de verificación",
        descripcion: "Indica si la cuenta está verificada y el tipo de verificación en X.",
        valorUsuario: data.verified ? 
          (data.verifiedType === 'blue' ? 'Verificación azul' : 'Verificación oficial') : 
          'No verificada',
        valorPromedio: "Varía",
        interpretacion: interpretVerified(data.verified, data.verifiedType)
      },
      {
        nombre: "Tasa de engagement",
        descripcion: "Mide la interacción de los seguidores con el contenido del usuario.",
        valorUsuario: `${metrics.engagementRate.toFixed(2)}%`,
        valorPromedio: "1-3%",
        interpretacion: interpretEngagementRate(metrics.engagementRate)
      }
    ];

    return (
      <div ref={reportRef} className="space-y-8">
        {/* Perfil del usuario */}
        <Card>
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Avatar className="h-20 w-20">
              <AvatarImage src={data.profileImage} alt={data.name} />
              <AvatarFallback>{data.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{data.name}</CardTitle>
              <p className="text-sm text-muted-foreground">@{data.username}</p>
              <div className="flex items-center mt-2 text-sm text-muted-foreground">
                <MapPin className="mr-1 h-4 w-4" />
                {data.location}
              </div>
              <div className="flex items-center mt-1 text-sm text-muted-foreground">
                <Calendar className="mr-1 h-4 w-4" />
                Se unió en {new Date(data.joinDate).toLocaleDateString()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{data.description}</p>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm font-medium">Seguidores</p>
                <p className="text-2xl font-bold">{data.followers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Siguiendo</p>
                <p className="text-2xl font-bold">{data.following.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Posts</p>
                <p className="text-2xl font-bold">{data.posts.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Análisis</p>
                <Badge className={botProbability < 50 ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                  {analysis}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráficas de barras de actividad del usuario */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad del usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Métricas clave (gráficas de dona) */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas clave</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-center">Probabilidad de ser bot</h3>
              {renderMetricPieChart(botProbability, 'Bot', '#ef4444')}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-center">Actividad diaria</h3>
              {renderMetricPieChart(Math.min(metrics.postsPerDay / 10 * 100, 100), 'Posts/día', '#3b82f6')}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-center">Ratio de seguidores</h3>
              {renderMetricPieChart(Math.min(metrics.followRatio * 10, 100), 'Seguidores/Siguiendo', '#10b981')}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-center">Originalidad de contenido</h3>
              {renderMetricPieChart(100 - metrics.repostPercentage, 'Posts originales', '#f59e0b')}
            </div>
          </CardContent>
        </Card>

        {/* Tabla de métricas detalladas */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas detalladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metricas.map((metrica, index) => (
                <div key={index} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{metrica.nombre}</h3>
                    <InfoTooltip content={metrica.descripcion} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Usuario</p>
                      <p className="font-medium">{metrica.valorUsuario}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Promedio</p>
                      <p className="font-medium">{metrica.valorPromedio}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Interpretación</p>
                      <p className="font-medium">{metrica.interpretacion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const interpretFollowRatio = (ratio: number): string => {
    if (ratio < 0.01) return "Muy bajo, típico de bots";
    if (ratio < 0.1) return "Bajo, posible bot";
    if (ratio > 100) return "Muy alto, posible cuenta popular o bot";
    return "Normal, típico de usuarios reales";
  };

  const interpretAccountAge = (days: number): string => {
    if (days < 30) return "Cuenta muy nueva, posible bot";
    if (days < 180) return "Cuenta relativamente nueva";
    return "Cuenta establecida";
  };

  const interpretPostsPerDay = (postsPerDay: number): string => {
    if (postsPerDay > 50) return "Extremadamente alto, probable bot";
    if (postsPerDay > 20) return "Alto, posible bot o usuario muy activo";
    if (postsPerDay < 0.1) return "Muy bajo, cuenta inactiva o bot dormido";
    return "Normal, típico de usuarios reales";
  };

  const interpretRepostPercentage = (percentage: number): string => {
    if (percentage > 80) return "Muy alto, típico de bots";
    if (percentage > 60) return "Alto, posible bot";
    if (percentage < 10) return "Muy bajo, posible cuenta original";
    return "Normal, típico de usuarios reales";
  };

  const interpretInteractionRate = (rate: number): string => {
    if (rate < 5) return "Muy bajo, posible bot";
    if (rate < 10) return "Bajo, posible bot o usuario poco interactivo";
    if (rate > 50) return "Muy alto, usuario muy interactivo";
    return "Normal, típico de usuarios reales";
  };

  const interpretVerified = (verified: boolean, verifiedType: string): string => {
    if (!verified) return "Cuenta no verificada, como la mayoría de los usuarios";
    if (verifiedType === 'blue') return "Cuenta con verificación azul, puede ser un usuario real o notable";
    return "Cuenta con verificación oficial, altamente probable que sea un usuario real y notable";
  };

  const interpretEngagementRate = (rate: number): string => {
    if (rate < 0.1) return "Muy bajo, posible bot o cuenta inactiva";
    if (rate < 1) return "Bajo, engagement limitado";
    if (rate < 3) return "Normal, típico de usuarios reales";
    if (rate < 10) return "Alto, cuenta con buen engagement";
    return "Muy alto, cuenta muy popular o influyente";
  };

  const handleLogout = async () => {
    localStorage.removeItem('authToken'); // Elimina el token de localStorage
    localStorage.removeItem('userName'); // Elimina el nombre de usuario de localStorage
    setCurrentUser(null); // Actualiza el estado de currentUser
    onLogout(); // Llama a la función de logout pasada como prop
    router.push('/login'); // Redirige a la página de login
  };

  const fetchAnalyzedUsers = async () => {
    try {
      const response = await axios.get('/api/usuarios-analizados'); // Nueva URL para la API
      setAnalyzedUsers(response.data); // Actualiza el estado con los usuarios analizados
    } catch (error) {
      console.error('Error fetching analyzed users:', error);
      // Aquí puedes manejar el error, por ejemplo, mostrando un mensaje al usuario
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login'); // Redirige a login si no hay token
    } else {
      const storedUserName = localStorage.getItem('userName'); // Obtener el nombre de usuario almacenado
      setCurrentUser(storedUserName); // Establecer el nombre de usuario actual
    }
}, [router]);

  const deselectUser = (username: string) => {
    setComparisonUsers(prev => prev.filter(user => user.username !== username));
  };

  return (
    <div className="container mx-auto p-4">
        {/* Menú superior */}
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
                <div className="text-lg font-bold">{currentUser ? `Bienvenido, ${currentUser}` : ''}</div>
                <div className="relative ml-4">
                    <Button onClick={() => setShowHistorial(!showHistorial)} style={{ fontSize: '0.8em' }}>
                        Historial
                    </Button>
                </div>
            </div>
            <Button onClick={handleLogout} variant="outline" style={{ fontSize: '0.8em' }}>Cerrar sesión</Button>
        </div>

        {/* Mostrar el historial si showHistorial es verdadero */}
        {showHistorial && <Historial />}
        {/* ... resto del componente ... */}

      <Card className="mb-8">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-2xl font-bold">Analizador de Usuarios de X</CardTitle>
          <ThemeToggle />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <Input
              type="text"
              placeholder="URL del perfil de X"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button type="submit" disabled={isLoading} className="text-xs">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              )}
              Analizar
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="my-8 mx-auto max-w-2xl">
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 text-red-500 mx-auto mb-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-red-500 font-semibold">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {analyzedUsers.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Usuarios analizados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Selecciona a dos usuarios para comparar
            </p>
            <div className="flex flex-wrap gap-4">
              {analyzedUsers.map(user => (
                <div key={user.username} className="flex flex-col items-center">
                  <Badge
                    variant={comparisonUsers.some(u => u.username === user.username) ? "default" : "outline"}
                    className="cursor-pointer mb-2"
                    onClick={() => handleUserSelect(user.username)}
                  >
                    {user.name}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {user.analyzedAt.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {comparisonUsers.length === 2 && compareUsers()}

      {selectedUser && (
        <div ref={reportRef} className="space-y-8 mt-8">
          {renderUserInfo(selectedUser)}
        </div>
      )}

      {analyzedUsers.length > 0 && (
        <Button onClick={generatePDF} className="mt-8">
          <Download className="mr-2 h-4 w-4" />
          Generar reporte PDF
        </Button>
      )}
    </div>
  )
}

export default AnalizadorUsuariosSocial