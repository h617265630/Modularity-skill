// ============================================================================
// UI/UX 生成服务 - Modularity-skill
// 调用 impeccable skill 生成高质量 UI
// ============================================================================

import type { FeatureTemplate } from '../core/types.js';

export interface UIGenerationContext {
  moduleName: string;
  description: string;
  models: {
    name: string;
    fields: Array<{
      name: string;
      type: string;
      description?: string;
    }>;
  }[];
  components: string[];
  pages: string[];
}

/**
 * 准备 UI 生成的上下文
 */
export function prepareUIContext(template: FeatureTemplate): UIGenerationContext {
  return {
    moduleName: template.feature_name,
    description: template.description,
    models: template.backend.models.map(m => ({
      name: m.name,
      fields: m.fields.map(f => ({
        name: f.name,
        type: f.type,
        description: f.foreign_key ? `FK to ${f.foreign_key}` : undefined,
      })),
    })),
    components: template.frontend.components.map(c => c.name),
    pages: template.frontend.pages.map(p => p.name),
  };
}

/**
 * 生成 UI 增强提示词
 */
export function generateUIPrompt(context: UIGenerationContext): string {
  const { moduleName, description, models, components, pages } = context;

  return `
## Task: Generate UI for ${moduleName} module

### Module Description
${description}

### Data Models
${models.map(m => `
**${m.name}**
${m.fields.map(f => `- ${f.name}: ${f.type}${f.description ? ` (${f.description})` : ''}`).join('\n')}
`).join('\n')}

### Required Components
${components.join(', ')}

### Pages
${pages.map(p => `- ${p}`).join('\n')}

### Requirements
1. Use shadcn/ui components
2. Follow Next.js 14 App Router conventions
3. Include proper loading and error states
4. Use TypeScript with proper types
5. Include responsive design
6. Follow Tailwind CSS best practices

### Output Format
Generate complete page components with full implementation.
`;
}

/**
 * UI 生成结果
 */
export interface UIGenerationResult {
  success: boolean;
  pages?: Record<string, string>;
  error?: string;
}

/**
 * 生成模块的增强 UI
 * 注意：这个函数需要与 impeccable skill 集成
 * 当前版本生成占位符，实际 UI 需要 AI 生成
 */
export async function generateModuleUI(
  context: UIGenerationContext
): Promise<UIGenerationResult> {
  // 检查是否有 API key 来调用 AI
  const hasClaudeKey = !!process.env.ANTHROPIC_API_KEY;

  if (!hasClaudeKey) {
    console.log('   ℹ️  ANTHROPIC_API_KEY not set, using default UI templates');
    return generateDefaultUI(context);
  }

  // TODO: 集成 impeccable skill 或直接调用 AI
  console.log('   🎨 AI UI generation not yet fully integrated');
  return generateDefaultUI(context);
}

/**
 * 生成默认 UI（骨架代码）
 */
function generateDefaultUI(context: UIGenerationContext): UIGenerationResult {
  const pages: Record<string, string> = {};

  // 为主页面生成骨架
  pages[`${context.moduleName}/page.tsx`] = generateDefaultPage(context);

  return {
    success: true,
    pages,
  };
}

/**
 * 生成默认页面组件
 */
function generateDefaultPage(context: UIGenerationContext): string {
  const modelName = context.models[0]?.name || 'Item';

  return `// File: ${context.moduleName}/page.tsx
// ============================================================================
// ${context.moduleName} - ${context.description}
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ${pascalCase(context.moduleName)}Page() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // TODO: Implement data fetching
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">{error}</p>
          <Button variant="outline" onClick={fetchData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">${context.description}</h1>
          <p className="text-muted-foreground">
            Manage your ${context.moduleName} data
          </p>
        </div>
        <Button>Add New</Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input placeholder="Search..." />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>${modelName} List</CardTitle>
          <CardDescription>
            Showing recent ${modelName.toLowerCase()} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            {/* TODO: Render ${modelName} data table */}
            No data available. Add your first entry.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function pascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}
`;
}

function pascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}
