import type { GalleryItem } from '../types';

function youtubeThumbnail(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export const galleryItems: GalleryItem[] = [
  {
    id: '2025-teaser',
    type: 'video',
    title: { en: 'B7G Kannada Rajyotsava Teaser 2025', kn: 'B7G ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ಟೀಸರ್ 2025' },
    thumbnail: youtubeThumbnail('_5ILACdC92U'),
    url: 'https://youtu.be/_5ILACdC92U',
    youtubeId: '_5ILACdC92U',
    year: '2025',
  },
  {
    id: '2025-sangeetha-sanje-1',
    type: 'video',
    title: { en: 'Sangeetha Sanje 2025 — Part 1', kn: 'ಸಂಗೀತ ಸಂಜೆ 2025 — ಭಾಗ 1' },
    thumbnail: youtubeThumbnail('EBNa18coxFA'),
    url: 'https://youtu.be/EBNa18coxFA',
    youtubeId: 'EBNa18coxFA',
    year: '2025',
  },
  {
    id: '2025-sangeetha-sanje-2',
    type: 'video',
    title: { en: 'Sangeetha Sanje 2025 — Part 2', kn: 'ಸಂಗೀತ ಸಂಜೆ 2025 — ಭಾಗ 2' },
    thumbnail: youtubeThumbnail('ZZYOE3qi_Gk'),
    url: 'https://youtu.be/ZZYOE3qi_Gk',
    youtubeId: 'ZZYOE3qi_Gk',
    year: '2025',
  },
  {
    id: '2025-sangeetha-sanje-3',
    type: 'video',
    title: { en: 'Sangeetha Sanje 2025 — Part 3', kn: 'ಸಂಗೀತ ಸಂಜೆ 2025 — ಭಾಗ 3' },
    thumbnail: youtubeThumbnail('kcRw1_NDg6k'),
    url: 'https://youtu.be/kcRw1_NDg6k',
    youtubeId: 'kcRw1_NDg6k',
    year: '2025',
  },
  {
    id: '2025-kala-suryodaya',
    type: 'video',
    title: { en: 'Kala Suryodaya — Rajyotsava 2025', kn: 'ಕಲಾ ಸೂರ್ಯೋದಯ — ರಾಜ್ಯೋತ್ಸವ 2025' },
    thumbnail: youtubeThumbnail('CGgfyXCArP4'),
    url: 'https://youtu.be/CGgfyXCArP4',
    youtubeId: 'CGgfyXCArP4',
    year: '2025',
  },
  {
    id: '2025-nage-sanje',
    type: 'video',
    title: { en: 'Nage Sanje — Rajyotsava 2025', kn: 'ನಗೆ ಸಂಜೆ — ರಾಜ್ಯೋತ್ಸವ 2025' },
    thumbnail: youtubeThumbnail('MjVmO8DjayA'),
    url: 'https://youtu.be/MjVmO8DjayA',
    youtubeId: 'MjVmO8DjayA',
    year: '2025',
  },
];
