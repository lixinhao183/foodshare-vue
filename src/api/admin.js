import request from "@/utils/request";

// 4.1 用户列表
export function getAdminUserList(params) {
  return request({
    url: "/admin/user/list",
    method: "get",
    params,
  });
}

// 4.2 修改用户状态
export function updateUserStatus(userId, status) {
  return request({
    url: `/admin/user/status/${userId}/${status}`,
    method: "put",
  });
}

// 4.3 帖子列表
export function getAdminPostList(params) {
  return request({
    url: "/admin/post/list",
    method: "get",
    params,
  });
}

// 4.4 审核帖子
export function auditPost(postId, status) {
  return request({
    url: `/admin/post/audit/${postId}/${status}`,
    method: "put",
  });
}

// 4.5 删除帖子
export function deleteAdminPost(postId) {
  return request({
    url: `/admin/post/${postId}`,
    method: "delete",
  });
}

// 4.6 发布公告
export function publishAnnouncement(data) {
  return request({
    url: "/admin/announcement",
    method: "post",
    data,
  });
}

// 4.7 删除公告
export function deleteAdminAnnouncement(id) {
  return request({
    url: `/admin/announcement/${id}`,
    method: "delete",
  });
}

// 4.7 举报记录列表
export function getReportList(params) {
  return request({
    url: "/admin/report/list",
    method: "get",
    params,
  });
}

// 4.8 处理举报记录（后端内部切换 isStatus：0<->1）
export function updateReportStatus(id) {
  return request({
    url: `/admin/report/${id}`,
    method: "put",
  });
}

// 4.8 批量新增标签
export function createAdminTags(data) {
  return request({
    url: "/admin/tag",
    method: "post",
    data,
  });
}

// 4.9 删除标签
export function deleteAdminTag(id) {
  return request({
    url: `/admin/tag/${id}`,
    method: "delete",
  });
}

// 4.10 查看用户角色
export function getUserRoleInfo(userId) {
  return request({
    url: "/admin/user/role",
    method: "get",
    params: { userId },
  });
}

// 4.11 修改用户角色
export function updateUserRole(data) {
  return request({
    url: "/admin/user/role",
    method: "put",
    data,
  });
}
