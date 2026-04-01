import { db } from '@/lib/db'
import {
  CreatePromptTemplateInput,
  UpdatePromptTemplateInput,
  PromptTemplate,
  ModelType,
  CreatePromptTemplateSchema
} from '@/lib/schemas/llmSchema'

/**
 * Prompt模板服务
 * 管理Prompt模板的创建、更新、删除和查询
 */
export class PromptTemplateService {
  /**
   * 转换模板数据（将数据库中的字符串转换为对象，日期转换为ISO字符串）
   */
  private transformTemplate(template: any): PromptTemplate {
    return {
      ...template,
      variables: JSON.parse(template.variables),
      examples: template.examples ? JSON.parse(template.examples) : [],
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString()
    }
  }

  /**
   * 创建Prompt模板
   */
  async createTemplate(data: CreatePromptTemplateInput): Promise<PromptTemplate> {
    const template = await db.promptTemplate.create({
      data: {
        ...data,
        variables: JSON.stringify(data.variables),
        examples: data.examples ? JSON.stringify(data.examples) : '[]'
      }
    })

    return this.transformTemplate(template)
  }

  /**
   * 获取Prompt模板列表
   */
  async getTemplates(query: {
    modelType?: ModelType
    provider?: string
    isActive?: boolean
    page?: number
    limit?: number
  } = {}): Promise<{
    templates: PromptTemplate[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }> {
    const { modelType, provider, isActive, page = 1, limit = 10 } = query
    const skip = (page - 1) * limit

    const where: any = {}
    if (modelType) where.modelType = modelType
    if (provider) where.provider = provider
    if (isActive !== undefined) where.isActive = isActive

    const [templates, total] = await Promise.all([
      db.promptTemplate.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      db.promptTemplate.count({ where })
    ])

    return {
      templates: templates.map(t => this.transformTemplate(t)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * 根据ID获取Prompt模板
   */
  async getTemplateById(id: string): Promise<PromptTemplate | null> {
    const template = await db.promptTemplate.findUnique({
      where: { id }
    })

    if (!template) return null

    return this.transformTemplate(template)
  }

  /**
   * 根据模型类型获取Prompt模板
   */
  async getTemplateByModelType(modelType: ModelType): Promise<PromptTemplate | null> {
    const template = await db.promptTemplate.findFirst({
      where: {
        modelType,
        isActive: true
      },
      orderBy: { version: 'desc' }
    })

    if (!template) return null

    return this.transformTemplate(template)
  }

  /**
   * 更新Prompt模板
   */
  async updateTemplate(
    id: string,
    data: UpdatePromptTemplateInput
  ): Promise<PromptTemplate> {
    const template = await db.promptTemplate.update({
      where: { id },
      data: {
        ...data,
        variables: data.variables ? JSON.stringify(data.variables) : undefined,
        examples: data.examples ? JSON.stringify(data.examples) : undefined
      }
    })

    return this.transformTemplate(template)
  }

  /**
   * 删除Prompt模板
   */
  async deleteTemplate(id: string): Promise<void> {
    await db.promptTemplate.delete({
      where: { id }
    })
  }

  /**
   * 渲染Prompt（替换变量）
   */
  renderTemplate(template: PromptTemplate, variables: Record<string, any>): string {
    let rendered = template.template

    template.variables.forEach(variableName => {
      const value = variables[variableName]
      if (value !== undefined) {
        const regex = new RegExp(`{{${variableName}}}`, 'g')
        rendered = rendered.replace(regex, String(value))
      }
    })

    return rendered
  }

  /**
   * 克隆Prompt模板
   */
  async cloneTemplate(id: string): Promise<PromptTemplate> {
    const original = await this.getTemplateById(id)
    if (!original) {
      throw new Error('模板不存在')
    }

    const cloned = await db.promptTemplate.create({
      data: {
        name: `${original.name} (副本)`,
        description: original.description,
        modelType: original.modelType,
        provider: original.provider,
        template: original.template,
        variables: JSON.stringify(original.variables),
        examples: original.examples ? JSON.stringify(original.examples) : '[]',
        version: `${original.version}-clone`,
        isActive: false
      }
    })

    return this.transformTemplate(cloned)
  }

  /**
   * 激活/停用Prompt模板
   */
  async toggleTemplate(id: string, isActive: boolean): Promise<PromptTemplate> {
    const template = await db.promptTemplate.update({
      where: { id },
      data: { isActive }
    })

    return this.transformTemplate(template)
  }

  /**
   * 验证Prompt模板
   */
  validateTemplate(template: PromptTemplate): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查模板中使用的变量是否都已定义
    const templateVars = template.template.match(/{{(\w+)}}/g) || []
    templateVars.forEach(varMatch => {
      const varName = varMatch.replace(/{{|}}/g, '')
      if (!template.variables.includes(varName)) {
        errors.push(`模板中使用了未定义的变量: ${varName}`)
      }
    })

    // 检查是否有未使用的变量
    template.variables.forEach(variableName => {
      if (!template.template.includes(`{{${variableName}}}`)) {
        warnings.push(`变量 ${variableName} 已定义但未在模板中使用`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 导入Prompt模板
   */
  async importTemplate(jsonData: string): Promise<PromptTemplate> {
    const data = JSON.parse(jsonData)
    const parsed = CreatePromptTemplateSchema.parse(data)
    return this.createTemplate(parsed)
  }

  /**
   * 导出Prompt模板
   */
  async exportTemplate(id: string): Promise<string> {
    const template = await this.getTemplateById(id)
    if (!template) {
      throw new Error('模板不存在')
    }

    return JSON.stringify(template, null, 2)
  }
}

// 导出服务实例
export const promptTemplateService = new PromptTemplateService()
