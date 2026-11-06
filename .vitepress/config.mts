import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  lang: 'zh-CN',
  site: 'https://docs.we-together.club',
  title: 'JavdBviewed 文档中心',
  description: 'JavdBviewed 的使用文档、功能说明、隐私政策与开发参考',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }]
  ],
  mermaid: {
    theme: 'neutral'
  },
  themeConfig: {
    logo: '/favicon-32x32.png',
    logoLink: '/',
    nav: [
      { text: '开始使用', link: '/start/' },
      {
        text: '使用指南',
        items: [
          { text: '浏览器扩展', link: '/guide/' },
          { text: '桌面端', link: '/desktop/' },
          { text: 'Android', link: '/mobile/' },
          { text: 'JavScribe 字幕', link: '/javscribe/' }
        ]
      },
      {
        text: '部署与连接',
        items: [
          { text: 'Cloud 部署', link: '/cloud/' },
          { text: '连接 Cloud', link: '/cloud/connections' },
          { text: '扩展 Cloud 同步', link: '/guide/cloud-sync' },
          { text: 'JavScribe 部署', link: '/javscribe/deployment' }
        ]
      },
      {
        text: '下载与更新',
        items: [
          { text: '下载中心', link: '/download/' },
          { text: '版本发布', link: '/reference/changelog' }
        ]
      },
      {
        text: '开发参考',
        items: [
          { text: '产品与服务关系', link: '/developer/ecosystem' },
          { text: '开发文档', link: '/developer/' }
        ]
      }
    ],
    sidebar: {
      '/start/': [
        {
          text: '选择产品',
          items: [{ text: '从这里开始', link: '/start/' }]
        }
      ],
      '/download/': [
        {
          text: '下载与更新',
          items: [
            { text: '下载中心', link: '/download/' },
            { text: '版本发布', link: '/reference/changelog' }
          ]
        }
      ],
      '/guide/': [
        {
          text: '入门',
          items: [
            { text: '扩展指南', link: '/guide/' },
            { text: '快速开始', link: '/guide/quick-start' },
            { text: '界面介绍', link: '/guide/interface' }
          ]
        },
        {
          text: '记录与整理',
          items: [
            { text: '视频标记', link: '/guide/video-marking' },
            { text: '数据管理', link: '/guide/data-management' },
            { text: '演员管理', link: '/guide/actor-management' },
            { text: '新作品监控', link: '/guide/new-works' },
            { text: '数据分析与报告', link: '/guide/data-insights' },
            { text: '报告设置', link: '/guide/settings-report' }
          ]
        },
        {
          text: '同步与媒体',
          items: [
            { text: 'WebDAV 备份', link: '/guide/webdav-sync' },
            { text: '连接 Cloud 同步', link: '/guide/cloud-sync' },
            { text: '媒体库', link: '/guide/media-library' },
            { text: '115 网盘集成', link: '/guide/115-drive' },
            { text: 'Emby 集成', link: '/guide/emby-integration' },
            { text: '搜索引擎与磁力搜索', link: '/guide/magnet-search' }
          ]
        },
        {
          text: '设置与维护',
          items: [
            { text: '设置导航', link: '/guide/settings-index' },
            { text: '显示设置', link: '/guide/settings-display' },
            { text: '功能增强', link: '/guide/page-enhancement' },
            { text: 'AI 翻译', link: '/guide/ai-translation' },
            { text: '隐私保护', link: '/guide/privacy-protection' },
            { text: '同步设置', link: '/guide/settings-sync' },
            { text: '网络配置', link: '/guide/settings-network' },
            { text: '高级配置', link: '/guide/settings-advanced' },
            { text: '日志设置', link: '/guide/settings-log' },
            { text: '全局操作', link: '/guide/settings-global-actions' },
            { text: '检查更新', link: '/guide/settings-update' },
            { text: '升级与数据迁移', link: '/guide/upgrade-v2' }
          ]
        },
        {
          text: '排查问题',
          items: [
            { text: '常见问题', link: '/guide/faq' }
          ]
        }
      ],
      '/desktop/': [
        {
          text: '桌面端',
          items: [
            { text: '概览', link: '/desktop/' },
            { text: '安装与首次使用', link: '/desktop/install' },
            { text: '本地媒体库', link: '/desktop/local-library' },
            { text: '媒体源', link: '/desktop/sources' },
            { text: '更新说明', link: '/desktop/updates' }
          ]
        }
      ],
      '/mobile/': [
        {
          text: 'Android',
          items: [
            { text: '概览', link: '/mobile/' },
            { text: '安装与首次使用', link: '/mobile/install' },
            { text: '媒体源', link: '/mobile/sources' },
            { text: '播放与下载', link: '/mobile/playback' },
            { text: '本地媒体库', link: '/mobile/library' }
          ]
        }
      ],
      '/cloud/': [
        {
          text: 'Cloud',
          items: [
            { text: '概览', link: '/cloud/' },
            { text: '部署与初始化', link: '/cloud/deployment' },
            { text: '连接客户端', link: '/cloud/connections' },
            { text: '备份与升级', link: '/cloud/backup-upgrade' },
            { text: '排查问题', link: '/cloud/troubleshooting' }
          ]
        }
      ],
      '/reference/': [
        {
          text: '参考资料',
          items: [
            { text: '项目概览', link: '/reference/project-overview' },
            { text: '版本发布', link: '/reference/changelog' },
            { text: '功能总览', link: '/reference/features' },
            { text: '隐私政策', link: '/reference/privacy-policy' }
          ]
        }
      ],
      '/developer/': [
        {
          text: '开发文档',
          items: [
            { text: '开发总览', link: '/developer/' },
            { text: '产品与服务关系', link: '/developer/ecosystem' },
            { text: '二次开发指南', link: '/developer/development' },
            { text: '架构说明', link: '/developer/architecture' },
            { text: '数据同步模块', link: '/developer/data-sync' },
            { text: '115 模块说明', link: '/developer/drive115-module' },
            { text: 'UI 组件说明', link: '/developer/ui-components' },
            { text: '任务编排中心', link: '/developer/task-orchestration' }
          ]
        }
      ],
      '/javscribe/': [
        {
          text: 'JavScribe 字幕服务',
          items: [
            { text: '概览', link: '/javscribe/' },
            { text: '部署指南', link: '/javscribe/deployment' },
            { text: '客户端', link: '/javscribe/workbench' },
            { text: '配置参考', link: '/javscribe/config' },
            { text: '常见问题', link: '/javscribe/faq' },
            { text: 'API 参考', link: '/javscribe/api' }
          ]
        }
      ]
    },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            displayDetails: '显示详细结果',
            resetButtonTitle: '清除搜索',
            backButtonTitle: '关闭搜索',
            noResultsText: '没有找到相关内容',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '选择结果',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '上一条结果',
              navigateDownKeyAriaLabel: '下一条结果',
              closeText: '关闭',
              closeKeyAriaLabel: '关闭搜索'
            }
          }
        }
      }
    },
    outline: { label: '本页目录', level: [2, 3] },
    sidebarMenuLabel: '目录',
    returnToTopLabel: '返回顶部',
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换为浅色主题',
    darkModeSwitchTitle: '切换为深色主题',
    skipToContentLabel: '跳转到正文',
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/JavdBviewed/JavdBviewed' }
    ],
    lastUpdated: {
      text: '最后更新'
    },
    footer: {
      message: 'JavdBviewed 文档中心',
      copyright: 'Copyright © 2026 lmixture'
    }
  }
}))
