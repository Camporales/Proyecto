import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username } = req.query

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' })
  }

  try {
    const response = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        params: {
          'user.fields': 'created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,withheld'
        },
        headers: {
          'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}`
        }
      }
    )

    if (response.data && response.data.data) {
      res.status(200).json(response.data.data)
    } else {
      res.status(404).json({ error: 'User not found' })
    }
  } catch (error) {
    console.error('Error en la API de X:', error)
    if (axios.isAxiosError(error)) {
      res.status(error.response?.status || 500).json({ error: error.response?.data || 'Error desconocido' })
    } else {
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  }
}