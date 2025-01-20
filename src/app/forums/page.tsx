'use client'

import { useState, useEffect } from 'react'
import { ForumCard } from '../../components/Forum/forum-card'
import { ForumHeader } from '../../components/Forum/forum-header'
import { Button } from "../../components/Forum/ui/button"
import { Textarea } from "../../components/Forum/ui/textarea"
import { X, Send } from 'lucide-react'
import { ForumCardSkeleton } from '../../components/Forum/forum-card-skeleton'
import { Checkbox } from "../../components/Forum/ui/checkbox"

interface ForumPost {
  id: number
  title: string
  author: string
  authorAvatar: string
  date: string
  content: string
  tags: string[]
  replies: number
  likes: number
  messages: { id: number; author: string; content: string }[]
  imageUrls: string[]
  isPinned?: boolean
}

export default function ForumsPage() {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [likedPosts, setLikedPosts] = useState<number[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<{
    type: 'like' | 'delete' | 'message';
    id: number;
  } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const currentUser = "Current User"

  const canManagePost = (postAuthor: string) => {
    return isAdmin || postAuthor === currentUser
  }

  const canManageMessage = (messageAuthor: string) => {
    return isAdmin || messageAuthor === currentUser
  }

  useEffect(() => {
    fetchPosts()
  }, [currentPage])


  const fetchPosts = async () => {
    if (!actionInProgress) {
      setInitialLoading(true)
    }
    try {
      const response = await fetch(`/api/forums?page=${currentPage}&limit=10`) 
      const data = await response.json()
      setPosts(data.posts)
      setAllTags(data.tags)
      setTotalPages(data.totalPages)
    } finally {
      setInitialLoading(false)
      setActionInProgress(null)
    }
  }

  const filteredPosts = posts.filter(post => // tag filtering system -- shows all posts if no tags are selected or posts containing any selected tag
    (selectedTags.length === 0 || post.tags.some(tag => selectedTags.includes(tag))) &&
    (post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     post.content.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleTagSelect = (tag: string) => { // tag toggle mechanism
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleAddMessage = async (postId: number, message: { author: string, content: string }) => { // add message to posts API
    await fetch('/api/forums', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'newMessage', postId, message }),
    })
    fetchPosts()
  }

  const handleToggleMessages = (postId: number) => {
    setExpandedPostId(prevId => prevId === postId ? null : postId)
  }

  const handleCreatePost = async (newPost: { title: string; content: string; tags: string[]; imageUrls: string[] }) => { // creates new forum posts to API
    const response = await fetch('/api/forums', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...newPost, type: 'newPost' }),
    })
    if (response.ok) {
      fetchPosts()
    }
  }

  const handleToggleLike = async (postId: number) => { // manages post likes
    const isLiked = likedPosts.includes(postId)
    
    // Optimistic update
    setLikedPosts(prev => 
      isLiked ? prev.filter(id => id !== postId) : [...prev, postId]
    )
    setPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + (isLiked ? -1 : 1) }
          : post
      )
    )

    setActionInProgress({ type: 'like', id: postId })
    
    try {
      const response = await fetch('/api/forums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'toggleLike', postId, isLiked }),
      })
      
      if (!response.ok) {
        setLikedPosts(prev => 
          isLiked ? [...prev, postId] : prev.filter(id => id !== postId)
        )
        setPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, likes: post.likes + (isLiked ? 1 : -1) }
              : post
          )
        )
      }
    } finally {
      setActionInProgress(null)
    }
  }

  const handleAddCustomTag = async (tag: string) => {
    const response = await fetch('/api/forums', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'addTag', tag }),
    })
    if (response.ok) {
      fetchPosts()
    }
  }

  const handleDeletePost = async (postId: number) => { // handles deletion of pots
    const response = await fetch('/api/forums', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'deletePost', postId }),
    })
    if (response.ok) {
      fetchPosts()
    }
  }

  const handleDeleteMessage = async (postId: number, messageId: number) => { // handles deletion of messages
    const response = await fetch('/api/forums', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'deleteMessage', postId, messageId }),
    })
    if (response.ok) {
      fetchPosts()
    }
  }

  const handleTogglePin = async (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      const response = await fetch('/api/forums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'togglePin', postId, isPinned: !post.isPinned }),
      });
      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  }

  const expandedPost = posts.find(post => post.id === expandedPostId)

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Banner Image */}
      <div className="w-full h-[40vh] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 to-blue-950/80 z-1" />
        <img 
          src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2069&auto=format&fit=crop"
          alt="Forum Banner"
          className="w-full h-full object-cover"
        />
        <h1 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold z-2 text-white text-center">
          Forums
        </h1>
        <p className="absolute top-[60%] left-1/2 transform -translate-x-1/2 text-xl text-slate-200 text-center mt-4 max-w-2xl">
          Discuss with NGOs and Individuals alike
        </p>
      </div>

      <div className="fixed bottom-4 right-4 flex items-center space-x-2 bg-white shadow-md p-2 rounded-lg z-[60]">
        <Checkbox
          id="admin-mode"
          checked={isAdmin}
          onCheckedChange={(checked) => setIsAdmin(checked as boolean)}
        />
        <label htmlFor="admin-mode" className="text-slate-900 text-sm">
          Admin Mode
        </label>
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className={`${expandedPostId ? 'w-2/3 pr-4' : 'w-full'}`}>
          <ForumHeader 
            tags={allTags} 
            selectedTags={selectedTags}
            onTagSelect={handleTagSelect}
            onSearch={handleSearch}
            onCreatePost={handleCreatePost}
            onAddCustomTag={isAdmin ? handleAddCustomTag : undefined}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {initialLoading ? (
              Array(6).fill(0).map((_, index) => (
                <ForumCardSkeleton key={index} />
              ))
            ) : (
              sortedPosts.map((post) => (
                <ForumCard 
                  key={post.id} 
                  {...post} 
                  onToggleMessages={handleToggleMessages}
                  onToggleLike={handleToggleLike}
                  onDeletePost={canManagePost(post.author) ? handleDeletePost : undefined}
                  onDeleteMessage={handleDeleteMessage}
                  onTogglePin={isAdmin ? handleTogglePin : undefined}
                  isExpanded={post.id === expandedPostId}
                  isLiked={likedPosts.includes(post.id)}
                  isActionInProgress={actionInProgress?.id === post.id}
                  isPinned={post.isPinned}
                  currentUser={currentUser}
                  canManageMessage={canManageMessage}
                />
              ))
            )}
          </div>
          <div className="mt-8 flex justify-center space-x-2">
            <Button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="self-center">{currentPage} of {totalPages}</span>
            <Button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
        {expandedPostId && expandedPost && (
           <div className="w-1/3 bg-white border-l border-slate-200 p-4 fixed top-0 right-0 h-full overflow-y-auto z-40">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Messages</h3>
              <Button variant="ghost" size="icon" onClick={() => setExpandedPostId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4 mb-4">
              {expandedPost.messages.map((message) => (
                <div key={message.id} className="border-b pb-2">
                  <p className="font-semibold">{message.author}</p>
                  <p>{message.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleAddMessage(expandedPost.id, { author: 'Current User', content: newMessage })
              setNewMessage('')
            }} className="space-y-2">
              <div className="flex items-center gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Add a message..."
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  size="icon"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

