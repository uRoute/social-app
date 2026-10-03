export interface IUser {
    _id: string
    name: string
    username: string
    email: string
    dateOfBirth: string
    gender: string
    photo: string
    cover: string
    bookmarks: string[]
    followers: any[]
    following: string[]
    createdAt: string
    followersCount: number
    followingCount: number
    bookmarksCount: number
    id: string
}
