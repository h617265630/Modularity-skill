// ============================================================================
// 模块页面生成器 - Modularity-skill
// 为模块生成实际的页面文件
// ============================================================================
import * as fs from 'fs';
import * as path from 'path';
/**
 * 为模块生成前端页面
 */
export async function generateModulePages(template, projectPath) {
    const frontendBase = path.join(projectPath, 'frontend', 'src', 'app');
    const featureName = template.feature_name;
    // 生成模块主页
    await generateModuleHomePage(template, frontendBase);
    // 生成模块的路由文件
    await generateModuleLayout(template, frontendBase);
    console.log(`   ✅ Module pages generated for ${featureName}`);
}
/**
 * 生成模块主页
 */
async function generateModuleHomePage(template, frontendBase) {
    const modulePath = path.join(frontendBase, template.feature_name);
    await fs.promises.mkdir(modulePath, { recursive: true });
    const componentImports = template.frontend.components
        .map(c => c.name)
        .join(', ');
    const pageContent = `// File: ${template.feature_name}/page.tsx
// ============================================================================
// ${template.feature_name} - Main Page
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ${componentImports} } from "@/components/${template.feature_name}";

export default function ${pascalCase(template.feature_name)}Page() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Fetch initial data
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">${template.description}</h1>
      </div>

      {/* Module content */}
      <div className="space-y-6">
        {/* TODO: Add module-specific content */}
      </div>
    </div>
  );
}

function pascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}
`;
    await fs.promises.writeFile(path.join(modulePath, 'page.tsx'), pageContent);
}
/**
 * 生成模块布局
 */
async function generateModuleLayout(template, frontendBase) {
    const modulePath = path.join(frontendBase, template.feature_name);
    await fs.promises.mkdir(modulePath, { recursive: true });
    // 如果有子页面，生成 layout
    if (template.frontend.pages && template.frontend.pages.length > 1) {
        const pagesLinks = template.frontend.pages
            .map(page => `          <Link
            href="${page.route}"
            className={\`block px-4 py-2 rounded-lg \${
              pathname === "${page.route}"
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-slate-100"
            }\`}
          >
            ${page.name}
          </Link>`)
            .join('\n');
        const layoutContent = `// File: ${template.feature_name}/layout.tsx
// ============================================================================
// ${template.feature_name} - Layout
// ============================================================================

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ${pascalCase(template.feature_name)}Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-slate-50">
        <nav className="p-4 space-y-1">
          <Link
            href="/${template.feature_name}"
            className={\`block px-4 py-2 rounded-lg \${
              pathname === "/${template.feature_name}"
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-slate-100"
            }\`}
          >
            Overview
          </Link>
${pagesLinks}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

function pascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}
`;
        await fs.promises.writeFile(path.join(modulePath, 'layout.tsx'), layoutContent);
    }
}
/**
 * 生成列表页
 */
async function generateListPage(template, frontendBase) {
    const listPath = path.join(frontendBase, template.feature_name, 'list');
    await fs.promises.mkdir(listPath, { recursive: true });
    const modelName = template.backend.models[0]?.name || 'Item';
    const pageContent = `// File: ${template.feature_name}/list/page.tsx
// ============================================================================
// ${template.feature_name} - List Page
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { use${modelName}List } from "@/hooks/use${modelName}";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ${modelName}ListPage() {
  const { items, loading, error, loadMore, hasMore } = use${modelName}List();
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">${template.description}</h1>
        <Button>Create New</Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* List */}
      {loading && items.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No items found</div>
      ) : (
        <div className="space-y-4">
          {items.map((item: any) => (
            <div key={item.id} className="p-4 bg-white rounded-lg border shadow-sm">
              {/* TODO: Render item */}
              <div>Item #{item.id}</div>
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore}>
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
`;
    await fs.promises.writeFile(path.join(listPath, 'page.tsx'), pageContent);
}
/**
 * 生成详情页
 */
async function generateDetailPage(template, frontendBase) {
    const detailPath = path.join(frontendBase, template.feature_name, '[id]');
    await fs.promises.mkdir(detailPath, { recursive: true });
    const modelName = template.backend.models[0]?.name || 'Item';
    const pageContent = `// File: ${template.feature_name}/[id]/page.tsx
// ============================================================================
// ${template.feature_name} - Detail Page
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { use${modelName} } from "@/hooks/use${modelName}";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ${modelName}DetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { item, loading, error } = use${modelName}(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-4 bg-yellow-50 text-yellow-600 rounded-lg">
          Item not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>${modelName} Details</CardTitle>
        </CardHeader>
        <CardContent>
          {/* TODO: Render item details */}
          <pre>{JSON.stringify(item, null, 2)}</pre>
        </CardContent>
      </Card>

      <div className="flex gap-4 mt-6">
        <Button variant="outline" onClick={() => window.history.back()}>
          Back
        </Button>
        <Button>Edit</Button>
      </div>
    </div>
  );
}
`;
    await fs.promises.writeFile(path.join(detailPath, 'page.tsx'), pageContent);
}
function pascalCase(str) {
    return str
        .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
        .replace(/^(.)/, (_, c) => c.toUpperCase());
}
//# sourceMappingURL=module-pages.js.map