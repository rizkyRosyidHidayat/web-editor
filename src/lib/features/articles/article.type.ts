export interface Articles {
  id: string
  created_at: string
  title: string
  category: string
  read_time: number
  image: string
  content: string
  author: string
  user_id: string
}

export interface ArticlesPayload {
  title: string
  category: string
  read_time: number
  image: string
  content: string
  author: string
}