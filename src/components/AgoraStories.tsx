import React from 'react'

export type PostAgora = {
  id: number
  image_url: string
  apelido: string | null
  texto: string
  created_at: string
  lat: number | null
  lng: number | null
}

export function AgoraStories({ posts, onAbrir }: { posts: PostAgora[]; onAbrir: (indice: number) => void }) {
  if (posts.length === 0) return null

  return (
    <div
      className="absolute left-0 w-full z-[999] pointer-events-none"
      style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}
    >
      <div className="flex gap-3 overflow-x-auto px-4 py-1 pointer-events-auto no-scrollbar">
        {posts.map((post, indice) => (
          <button
            key={post.id}
            onClick={() => onAbrir(indice)}
            className="flex flex-col items-center gap-1 flex-shrink-0 w-14"
          >
            <div
              className="w-14 h-14 rounded-full flex-shrink-0"
              style={{
                backgroundImage: 'linear-gradient(135deg, #5e25ff, #80ff00)',
                padding: 2
              }}
            >
              <div
                className="w-full h-full rounded-full bg-background border-2 border-background"
                style={{
                  backgroundImage: `url('${post.image_url}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
            </div>
            <span className="text-[8px] font-mono text-accent/70 truncate w-full text-center">
              {post.apelido || 'ANÔNIMO'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}