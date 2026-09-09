// 用于侧边栏的菜单路由（从主路由中抽取，保持树形结构）
import Layout from '@/layout/index.vue'

export const menuRoutes = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: { title: '首页总览', icon: 'Odometer' }
  },
  {
    path: '/basic',
    name: 'Basic',
    meta: { title: '通用基础与安全计算', icon: 'Setting' },
    children: [
      {
        path: 'parameters',
        name: 'BasicParameters',
        component: () => import('@/views/basic/parameters.vue'),
        meta: { title: '基础参数管理' }
      },
      {
        path: 'database',
        name: 'BasicDatabase',
        component: () => import('@/views/basic/database.vue'),
        meta: { title: '专属数据库' }
      },
      {
        path: 'models',
        name: 'BasicModels',
        component: () => import('@/views/basic/models.vue'),
        meta: { title: '安全计算模型引擎' }
      },
      {
        path: 'risk-levels',
        name: 'RiskLevels',
        component: () => import('@/views/basic/risk-levels.vue'),
        meta: { title: '危险等级与评估规则' }
      },
      {
        path: 'scenario-assess',
        name: 'ScenarioAssess',
        component: () => import('@/views/basic/scenario-assess.vue'),
        meta: { title: '作业场景风险评估' }
      },
      {
        path: 'formulas',
        name: 'Formulas',
        component: () => import('@/views/basic/formulas.vue'),
        meta: { title: '公式图表汇编' }
      }
    ]
  },
  {
    path: '/warning',
    name: 'Warning',
    meta: { title: '安全预警与极限工况', icon: 'Warning' },
    children: [
      {
        path: 'multi-dim-warning',
        name: 'MultiDimWarning',
        component: () => import('@/views/warning/multi-dim-warning.vue'),
        meta: { title: '多维度预警要素' }
      },
      {
        path: 'limit-judgment',
        name: 'LimitJudgment',
        component: () => import('@/views/warning/limit-judgment.vue'),
        meta: { title: '极限工况判定' }
      },
      {
        path: 'visual-warning',
        name: 'VisualWarning',
        component: () => import('@/views/warning/visual-warning.vue'),
        meta: { title: '可视化预警展示' }
      },
      {
        path: 'flood-drill',
        name: 'FloodDrill',
        component: () => import('@/views/warning/flood-drill.vue'),
        meta: { title: '破损进水险情推演' }
      }
    ]
  },
  {
    path: '/decision',
    name: 'Decision',
    meta: { title: '动态安全处置决策', icon: 'Guide' },
    children: [
      {
        path: 'timeline-tree',
        name: 'TimelineTree',
        component: () => import('@/views/decision/timeline-tree.vue'),
        meta: { title: '三轴一体化' }
      },
      {
        path: 'dynamic-tree',
        name: 'DynamicTree',
        component: () => import('@/views/decision/dynamic-tree.vue'),
        meta: { title: '动态处置决策树' }
      },
      {
        path: 'closed-loop',
        name: 'ClosedLoop',
        component: () => import('@/views/decision/closed-loop.vue'),
        meta: { title: '险情分级闭环处置' }
      }
    ]
  },
  {
    path: '/intelligent',
    name: 'Intelligent',
    meta: { title: '智能安全处置决策', icon: 'Cpu' },
    children: [
      {
        path: 'sample-library',
        name: 'SampleLibrary',
        component: () => import('@/views/intelligent/sample-library.vue'),
        meta: { title: '学习样本库' }
      },
      {
        path: 'knowledge-graph',
        name: 'KnowledgeGraph',
        component: () => import('@/views/intelligent/knowledge-graph.vue'),
        meta: { title: '安全知识图谱' }
      },
      {
        path: 'risk-identification',
        name: 'RiskIdentification',
        component: () => import('@/views/intelligent/risk-identification.vue'),
        meta: { title: '组合式风险识别' }
      },
      {
        path: 'reasoning',
        name: 'Reasoning',
        component: () => import('@/views/intelligent/reasoning.vue'),
        meta: { title: '智能化推理与辅助决策' }
      }
    ]
  }
]