import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Helper to get GoogleGenAI client safely
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API endpoint to search/generate realistic kid-safe video results using Gemini
app.post('/api/gemini/search-videos', async (req, res) => {
  try {
    const { query, keyword } = req.body;
    const searchTerm = query || keyword || 'kids learning cartoons';

    const ai = getGenAIClient();
    if (!ai) {
      // Fallback response if GEMINI_API_KEY is not configured
      return res.json({
        success: true,
        source: 'fallback',
        videos: [
          {
            id: `gen-${Date.now()}-1`,
            title: `${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)} - Fun Adventures!`,
            description: `Super fun and educational ${searchTerm} compilation for kids and toddlers. Safe, colorful, and engaging!`,
            channelTitle: 'Kids Cartoon Kingdom',
            thumbnailUrl: `https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80`,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            duration: '10:24',
            views: '1.2M views',
            publishedAt: '2 days ago',
            tags: [searchTerm, 'kids', 'fun', 'cartoons'],
            ageGroup: '3-8',
          },
          {
            id: `gen-${Date.now()}-2`,
            title: `Learn with ${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)} | Songs & Stories`,
            description: `Interactive learning songs and animated stories featuring ${searchTerm}. Sing along and discover new things!`,
            channelTitle: 'Fun & Learn TV',
            thumbnailUrl: `https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=600&auto=format&fit=crop&q=80`,
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            duration: '08:15',
            views: '850K views',
            publishedAt: '1 week ago',
            tags: [searchTerm, 'learning', 'songs', 'educational'],
            ageGroup: '2-6',
          },
        ],
      });
    }

    // Call Gemini 3.6 Flash for rich structured video metadata generation
    const prompt = `You are a YouTube search catalog generator for a Kids Safe Video application.
Generate 4 realistic, high quality, kid-friendly YouTube video items for the parent search query: "${searchTerm}".
Return a JSON array where each video has:
- title: engaging title matching the topic
- description: concise kid-safe video description
- channelTitle: realistic channel name (e.g. "Toon World", "Nursery Rhymes Club")
- duration: length formatted as MM:SS (e.g. "05:30")
- views: view count formatted (e.g. "2.4M views")
- publishedAt: time string (e.g. "3 days ago")
- videoCategory: category like "Cartoons", "Educational", "Music", "Stories", "Science"
- ageGroup: target age range e.g. "2-5" or "6-10"
- thumbnailKeyword: a 1-2 word keyword to pick an aesthetic kid picture (e.g. "cartoon", "bunny", "dinosaur", "toy", "space")`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              channelTitle: { type: Type.STRING },
              duration: { type: Type.STRING },
              views: { type: Type.STRING },
              publishedAt: { type: Type.STRING },
              videoCategory: { type: Type.STRING },
              ageGroup: { type: Type.STRING },
              thumbnailKeyword: { type: Type.STRING },
            },
            required: ['title', 'description', 'channelTitle', 'duration', 'views'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    
    // Sample HTML5 open-source video URLs for reliable streaming playback
    const sampleVideos = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreet.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    ];

    const thumbnailUnsplashPool = [
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=600&auto=format&fit=crop&q=80',
    ];

    const videos = parsed.map((item: any, idx: number) => ({
      id: `gemini-${Date.now()}-${idx}`,
      title: item.title,
      description: item.description,
      channelTitle: item.channelTitle || 'Kids World TV',
      thumbnailUrl: thumbnailUnsplashPool[idx % thumbnailUnsplashPool.length],
      videoUrl: sampleVideos[idx % sampleVideos.length],
      duration: item.duration || '05:00',
      views: item.views || '1.5M views',
      publishedAt: item.publishedAt || '1 week ago',
      tags: [searchTerm, item.videoCategory || 'Kids'],
      ageGroup: item.ageGroup || '3-8',
      keywordMatched: searchTerm,
    }));

    return res.json({ success: true, videos, source: 'gemini' });
  } catch (error: any) {
    console.error('Error generating videos with Gemini:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
