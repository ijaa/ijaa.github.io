export type Project = {
  id: string
  index: string
  title: string
  description: string
  href: string
  image: string
  accent: string
}

export const projects: Project[] = [
  {
    id: 'baby-future',
    index: '01',
    title: 'Baby Future',
    description: '把孕期影像整理成适合家庭保存和分享的纪念体验。',
    href: 'https://ijaa.github.io/baby-future/',
    image: '/assets/baby-future/gpt_image_20260529_215218_400550.png',
    accent: '#ff8f70',
  },
  {
    id: 'image-story',
    index: '02',
    title: 'Image Story',
    description: '用图像生成与叙事编排，把单张图片延展成轻量故事。',
    href: 'https://ijaa.github.io/image-story/',
    image: '/assets/image-story/gpt_image_20260529_215246_685134.png',
    accent: '#41d5c5',
  },
  {
    id: 'gpt-image-gen',
    index: '03',
    title: 'GPT Image Gen',
    description: '面向提示词、参数和结果管理的浏览器端 AI 图片工作台。',
    href: 'https://ijaa.github.io/gpt-image-gen/',
    image: '/assets/gpt-image-gen/gpt_image_20260529_215309_641013.png',
    accent: '#f4b447',
  },
  {
    id: 'poem-gallery',
    index: '04',
    title: 'Poem Gallery',
    description: '沉浸式浏览 124 张古诗词竖版卡片，配合缩略图切换与背景音乐欣赏。',
    href: 'https://ijaa.github.io/poem-gallery/',
    image: '/assets/poem-gallery/poem-gallery-cover.png',
    accent: '#7f9f8d',
  },
]

export const services = [
  'AI Prompt工程',
  '图片艺术生成',
  'Agent产品开发',
  'Skill定制与优化',
  '全栈开发',
]
