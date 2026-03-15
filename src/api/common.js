import request from '@/utils/request'

// 3.1 文件上传
export function uploadFile(data) {
  return request({
    url: '/file/upload',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data
  })
}
