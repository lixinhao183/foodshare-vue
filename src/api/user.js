import request from "@/utils/request";

// 1.1 用户登录
export function login(data) {
  return request({
    url: "/user/login",
    method: "post",
    data,
  });
}

// 1.2 用户退出登录
export function logout() {
  return request({
    url: "/user/logout",
    method: "get",
  });
}

// 1.3 用户注册
export function register(data) {
  return request({
    url: "/user/register",
    method: "post",
    data,
  });
}

// 1.4 更新用户信息
export function updateUserInfo(data) {
  return request({
    url: "/user/update",
    method: "put",
    data,
  });
}

// 1.5 获取个人信息
export function getUserInfo(userId) {
  return request({
    url: "/user/info",
    method: "get",
    params: userId !== undefined && userId !== null ? { userId } : {},
  });
}

// 1.6 查询关注用户
export function getFollows(params) {
  return request({
    url: "/user/follows",
    method: "get",
    params,
  });
}

// 1.7 查询粉丝用户
export function getFans(params) {
  return request({
    url: "/user/fans",
    method: "get",
    params,
  });
}

// 1.8 查询浏览记录
export function getViewHistory(params) {
  return request({
    url: "/user/viewhistory",
    method: "get",
    params,
  });
}

// 1.9 查询收藏帖子
export function getFavouritePosts(params) {
  return request({
    url: "/user/favourite",
    method: "get",
    params,
  });
}

// 1.10 发布帖子
export function publishPost(data) {
  return request({
    url: "/user/post/publish",
    method: "post",
    data,
  });
}

// 1.11 查询用户发布的帖子
export function getUserPosts(params) {
  return request({
    url: "/user/post",
    method: "get",
    params,
  });
}

// 1.12 删除帖子
export function deleteUserPost(postId) {
  return request({
    url: `/user/post/${postId}`,
    method: "delete",
  });
}

// 1.17 关注用户
export function followUser(userId) {
  return request({
    url: `/user/follow/${userId}`,
    method: "post",
  });
}

// 1.18 取消关注用户
export function unfollowUser(userId) {
  return request({
    url: `/user/follow/${userId}`,
    method: "delete",
  });
}

// 1.19 点赞帖子
export function likePost(postId) {
  return request({
    url: `/user/like/${postId}`,
    method: "post",
  });
}

// 1.20 取消点赞帖子
export function unlikePost(postId) {
  return request({
    url: `/user/like/${postId}`,
    method: "delete",
  });
}

// 1.21 点赞评论
export function likeComment(commentId) {
  return request({
    url: `/user/like/comment/${commentId}`,
    method: "post",
  });
}

// 1.22 取消点赞评论
export function unlikeComment(commentId) {
  return request({
    url: `/user/like/comment/${commentId}`,
    method: "delete",
  });
}

// 1.23 用户收藏帖子
export function favouritePost(postId) {
  return request({
    url: `/user/favourite/${postId}`,
    method: "post",
  });
}

// 1.24 用户取消收藏帖子
export function unfavouritePost(postId) {
  return request({
    url: `/user/favourite/${postId}`,
    method: "delete",
  });
}

// 1.13 查询公告列表
export function getAnnouncements(params) {
  return request({
    url: "/user/announcement",
    method: "get",
    params,
  });
}

// 1.15 用户举报
export function reportUser(data) {
  return request({
    url: "/user/report",
    method: "post",
    data,
  });
}

// 1.16 发表评论
export function publishComment(data) {
  return request({
    url: "/user/comment",
    method: "post",
    data,
  });
}

// 1.17 删除评论
export function deleteComment(commentId) {
  return request({
    url: `/user/comment/${commentId}`,
    method: "delete",
  });
}
