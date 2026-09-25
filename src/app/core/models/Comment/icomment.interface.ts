export interface IComment {
    _id: string
    content: string
    image: string
    commentCreator: CommentCreator
    post: string
    parentComment: any
    likes: string[]
    createdAt: string
    repliesCount: number
}

export interface CommentCreator {
    _id: string
    name: string
    username: string
    photo: string
}
