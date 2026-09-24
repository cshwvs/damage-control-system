// 用于侧边栏的菜单路由（按四大模块组织，保持树形结构）
export const menuRoutes = [
  {
    path: '/platform',
    name: 'Platform',
    meta: { title: '平台及数据管理', icon: 'Setting' },
    children: [
      {
        path: 'risk-levels',
        name: 'AssessRiskLevels',
        component: () => import('@/views/basic/risk-levels.vue'),
        meta: { title: '通用危险等级与评估' }
      },
      {
        path: 'scenario-assess',
        name: 'AssessScenario',
        component: () => import('@/views/basic/scenario-assess.vue'),
        meta: { title: '作业场景安全评估' }
      },
      {
        path: 'visual-warning',
        name: 'PlatformVisual',
        component: () => import('@/views/warning/visual-warning.vue'),
        meta: { title: '三维物理环境搭建' }
      },
      {
        path: 'parameters',
        name: 'PlatformParameters',
        component: () => import('@/views/basic/parameters.vue'),
        meta: { title: '结构数据库调用' }
      },
      {
        path: 'database',
        name: 'PlatformDatabase',
        component: () => import('@/views/basic/database.vue'),
        meta: { title: '专属数据库调用' }
      },
      {
        path: 'formulas',
        name: 'PlatformFormulas',
        component: () => import('@/views/basic/formulas.vue'),
        meta: { title: '电子图表手册' }
      }
    ]
  },
  {
    path: '/assessment',
    name: 'Assessment',
    meta: { title: '防沉抗沉安全评估', icon: 'Warning' },
    children: [
      
      {
        path: 'models',
        name: 'AssessModels',
        component: () => import('@/views/basic/models.vue'),
        meta: { title: '安全计算模型引擎' }
      },
      {
        path: 'visual-warning',
        name: 'DecisionVisual',
        component: () => import('@/views/warning/multi-dim-warning.vue'),
        meta: { title: '多维度预警要素' }
      },
      {
        path: 'timeline-tree',
        name: 'DecisionTimeline',
        component: () => import('@/views/decision/timeline-tree.vue'),
        meta: { title: '险情处置时长量化' }
      }
      
      
      
    ]
  },
  {
    path: '/decision',
    name: 'Decision',
    meta: { title: '抗沉决策', icon: 'Guide' },
    children: [
      
      
      {
        path: 'limit-judgment',
        name: 'AssessLimit',
        component: () => import('@/views/warning/limit-judgment.vue'),
        meta: { title: '极限险情判定' }
      },
      
      {
        path: 'flood-drill',
        name: 'AssessFloodDrill',
        component: () => import('@/views/warning/flood-drill.vue'),
        meta: { title: '可视化预警' }
      }
      
    ]
  },
  {
    path: '/intelligence',
    name: 'Intelligence',
    meta: { title: '智能技术', icon: 'Cpu' },
    children: [
      {
        path: 'sample-library',
        name: 'IntelSamples',
        component: () => import('@/views/intelligent/sample-library.vue'),
        meta: { title: '学习样本数据集' }
      },
      {
        path: 'closed-loop',
        name: 'DecisionClosedLoop',
        component: () => import('@/views/decision/closed-loop.vue'),
        meta: { title: '破损进水险情分级推演' }
      },
      {
        path: 'dynamic-tree',
        name: 'DecisionDynamicTree',
        component: () => import('@/views/decision/dynamic-tree.vue'),
        meta: { title: '动态处置决策' }
      },
      {
        path: 'reasoning',
        name: 'IntelReasoning',
        component: () => import('@/views/intelligent/reasoning.vue'),
        meta: { title: '本体推理与辅助决策' }
      },
      {
        path: 'knowledge-graph',
        name: 'IntelGraph',
        component: () => import('@/views/intelligent/knowledge-graph.vue'),
        meta: { title: '安全知识图谱' }
      }
      
      
    ]
  }
]
