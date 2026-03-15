import request from "@/utils/request";

// 2.1 帖子列表 (首页/发现)
export function getPostList(params) {
  return request({
    url: "/post/list",
    method: "get",
    params,
  });
}

// 2.2 帖子详情
export function getPostDetail(postId) {
  return request({
    url: "/post/detail",
    method: "get",
    params: { postId },
  });
}

// 2.3 查询评论列表
export function getCommentList(params) {
  return request({
    url: "/post/comment/list",
    method: "get",
    params,
  });
}

// 2.4 分页查询标签
export function getTags(params) {
  return request({
    url: "/post/tag",
    method: "get",
    params,
  });
}
