import request from '@/utils/request'

// 获取本体术语表列表
export function getGlossaries() {
  return request.get('/v1/glossaries')
}

// 获取某个术语表下的术语
export function getGlossaryTerms(glossaryId) {
  return request.get('/v1/glossaryTerms', {
    params: { glossary: glossaryId, limit: 100 }
  })
}

// 获取标签分类
export function getClassifications() {
  return request.get('/v1/classifications')
}

// 获取标签
export function getTags(classificationName) {
  return request.get('/v1/tags', {
    params: { classification: classificationName, limit: 100 }
  })
}

// 本体推理规则查询（示例：通过术语搜索关联规则）
export function searchEntities(query, index = 'all') {
  return request.get('/v1/search/query', {
    params: {
      q: query,
      index,
      from: 0,
      size: 20,
      deleted: false
    }
  })
}

// 获取实体详情（用于知识图谱节点）
export function getEntityByFqn(entityType, fqn) {
  return request.get(`/v1/${entityType}/name/${encodeURIComponent(fqn)}`)
}