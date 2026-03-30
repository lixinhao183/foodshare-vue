import request from "@/utils/request";

/**
 * 获取所有位置分类列表
 */
export function getLocalList() {
  return request({
    url: "/local/list",
    method: "get",
  });
}

/**
 * 根据 ID 查询位置详情
 * @param {number} localId
 */
export function getLocalById(localId) {
  return request({
    url: `/local/${localId}`,
    method: "get",
  });
}

/**
 * 新增位置分类
 * @param {Object} data { localName }
 */
export function createLocal(data) {
  return request({
    url: "/local",
    method: "post",
    data,
  });
}

/**
 * 修改位置分类
 * @param {Object} data { localId, localName }
 */
export function updateLocal(data) {
  return request({
    url: "/local",
    method: "put",
    data,
  });
}

/**
 * 删除位置分类
 * @param {number} localId
 */
export function deleteLocal(localId) {
  return request({
    url: `/local/${localId}`,
    method: "delete",
  });
}
