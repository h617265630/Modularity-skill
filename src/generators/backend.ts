// ============================================================================
// 后端代码生成器 - Modularity-skill
// 生成带文件标记的模块化代码
// ============================================================================

import { FeatureTemplate, TechStack, MethodTemplate, RouteTemplate } from '../core/types.js';
import { BaseGenerator, kebabCase, pascalCase } from './base-generator.js';
import { snakeCase } from './shared/strings.js';
import { getPythonType, getSqlAlchemyType, getSqlTypeMap } from './shared/schema.js';
import { generatePydanticValidators } from './shared/validation.js';
import { AICodeGenerator } from './ai-code-generator.js';
import { TEMPLATE_SNIPPETS, fillSnippet } from './template-snippets.js';
import type { FieldConfig } from './shared/types.js';

export class BackendGenerator extends BaseGenerator {
  private aiGenerator: AICodeGenerator;

  constructor(options?: any) {
    super(options || {});
    this.aiGenerator = new AICodeGenerator();
  }

  async generate(template: FeatureTemplate, stack: TechStack): Promise<string> {
    const parts: string[] = [];

    // 1. 生成模型文件
    for (const model of template.backend.models) {
      parts.push(this.generateModelFile(model));
    }

    // 2. 生成 Schema 文件
    for (const model of template.backend.models) {
      parts.push(this.generateSchemaFile(model));
    }

    // 3. 生成 CRUD 文件
    for (const curd of template.backend.curds || []) {
      const model = template.backend.models.find(m => m.name === curd.model_name);
      if (model) {
        parts.push(this.generateCrudFile(curd, model));
      }
    }

    // 4. 生成 API 路由文件
    parts.push(await this.generateRoutesFile(template));

    // 5. 生成 Service 文件
    for (const service of template.backend.services) {
      parts.push(await this.generateServiceFile(service, template));
    }

    return parts.join('\n');
  }

  private generateModelFile(model: any): string {
    const fileName = 'app/models/' + kebabCase(model.name) + '.py';
    const lines: string[] = [];

    lines.push('# File: ' + fileName);
    lines.push('# ============================================================================');
    lines.push('# ' + model.name + ' Model - SQLAlchemy');
    lines.push('# ============================================================================');
    lines.push('');
    lines.push('from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Index, Text');
    lines.push('from sqlalchemy.orm import relationship');
    lines.push('from datetime import datetime');
    lines.push('from ..db.base import Base');
    lines.push('');

    const indexes = model.indexes || [];
    let indexArgs = '';
    if (indexes.length > 0) {
      indexArgs = '\n    __table_args__ = (';
      const idxStrs = indexes.map((idx: any) => {
        return '        Index(\'' + idx.name + '\', ' + idx.columns.map((c: string) => '\'' + c + '\'').join(', ') + ')';
      });
      indexArgs += idxStrs.join(',\n') + '\n    )';
    }

    lines.push('class ' + model.name + '(Base):');
    lines.push('    __tablename__ = "' + model.table_name + '"' + indexArgs);
    lines.push('');

    for (const field of model.fields) {
      const fieldDef = this.generateFieldDef(field);
      lines.push(fieldDef);
    }

    return lines.join('\n');
  }

  private generateSchemaFile(model: any): string {
    const fileName = 'app/schemas/' + kebabCase(model.name) + '.py';
    const lines: string[] = [];

    lines.push('# File: ' + fileName);
    lines.push('# ============================================================================');
    lines.push('# ' + model.name + ' Pydantic Schemas');
    lines.push('# ============================================================================');
    lines.push('');
    lines.push('from pydantic import BaseModel');
    lines.push('from typing import Optional');
    lines.push('from datetime import datetime');
    lines.push('');

    lines.push('class ' + model.name + 'Base(BaseModel):');
    for (const field of model.fields) {
      const pyType = this.mapTypeToPython(field.type);
      const optional = field.nullable ? 'Optional[' : '';
      const end = field.nullable ? ']' : '';
      lines.push('    ' + field.name + ': ' + optional + pyType + end);
    }

    lines.push('');
    lines.push('class ' + model.name + 'Create(' + model.name + 'Base):');
    lines.push('    pass');
    lines.push('');
    lines.push('class ' + model.name + 'Update(' + model.name + 'Base):');
    lines.push('    pass');
    lines.push('');
    lines.push('class ' + model.name + 'Response(' + model.name + 'Base):');
    lines.push('    id: int');
    lines.push('    created_at: Optional[datetime] = None');
    lines.push('    updated_at: Optional[datetime] = None');
    lines.push('    class Config:');
    lines.push('        from_attributes = True');

    return lines.join('\n');
  }

  private generateCrudFile(curd: any, model: any): string {
    const fileName = 'app/cruds/' + kebabCase(curd.model_name) + '_crud.py';
    const modelVar = kebabCase(curd.model_name);

    const lines: string[] = [];
    lines.push('# File: ' + fileName);
    lines.push('# ============================================================================');
    lines.push('# ' + curd.model_name + ' CRUD Operations');
    lines.push('# ============================================================================');
    lines.push('');
    lines.push('from sqlalchemy.orm import Session');
    lines.push('from typing import List, Optional');
    lines.push('from ..models.' + modelVar + ' import ' + curd.model_name);
    lines.push('from ..schemas.' + modelVar + ' import ' + curd.model_name + 'Create, ' + curd.model_name + 'Update, ' + curd.model_name + 'Response');
    lines.push('from datetime import datetime');
    lines.push('');

    lines.push('class ' + curd.model_name + 'CRUD:');
    lines.push('    """CRUD operations for ' + curd.model_name + '"""');
    lines.push('');

    if (curd.operations.includes('create')) {
      lines.push('    def create(self, db: Session, obj_in: dict):');
      lines.push('        """Create new ' + curd.model_name + '"""');
      lines.push('        db_obj = ' + curd.model_name + '(**obj_in)');
      lines.push('        db.add(db_obj)');
      lines.push('        db.commit()');
      lines.push('        db.refresh(db_obj)');
      lines.push('        return db_obj');
      lines.push('');
    }

    if (curd.operations.includes('read')) {
      lines.push('    def get(self, db: Session, id: int):');
      lines.push('        """Get ' + curd.model_name + ' by ID"""');
      lines.push('        return db.query(' + curd.model_name + ').filter(' + curd.model_name + '.id == id).first()');
      lines.push('');
      lines.push('    def get_multi(self, db: Session, skip: int = 0, limit: int = 100):');
      lines.push('        """Get multiple ' + curd.model_name + 's"""');
      lines.push('        return db.query(' + curd.model_name + ').offset(skip).limit(limit).all()');
      lines.push('');
    }

    if (curd.operations.includes('update')) {
      lines.push('    def update(self, db: Session, db_obj: ' + curd.model_name + ', obj_in: dict):');
      lines.push('        """Update ' + curd.model_name + '"""');
      lines.push('        for field, value in obj_in.items():');
      lines.push('            if hasattr(db_obj, field):');
      lines.push('                setattr(db_obj, field, value)');
      lines.push('        if hasattr(db_obj, "updated_at"):');
      lines.push('            db_obj.updated_at = datetime.utcnow()');
      lines.push('        db.commit()');
      lines.push('        db.refresh(db_obj)');
      lines.push('        return db_obj');
      lines.push('');
    }

    if (curd.operations.includes('delete')) {
      lines.push('    def delete(self, db: Session, id: int):');
      lines.push('        """Delete ' + curd.model_name + '"""');
      lines.push('        obj = db.query(' + curd.model_name + ').filter(' + curd.model_name + '.id == id).first()');
      lines.push('        if obj:');
      lines.push('            db.delete(obj)');
      lines.push('            db.commit()');
      lines.push('        return obj');
      lines.push('');
    }

    lines.push(curd.model_name + '_crud = ' + curd.model_name + 'CRUD()');

    return lines.join('\n');
  }

  private async generateRoutesFile(template: FeatureTemplate): Promise<string> {
    const fileName = 'app/api/' + kebabCase(template.feature_name) + '.py';

    const lines: string[] = [];
    lines.push('# File: ' + fileName);
    lines.push('# ============================================================================');
    lines.push('# ' + template.feature_name + ' API Routes');
    lines.push('# ============================================================================');
    lines.push('');
    lines.push('from fastapi import APIRouter, Depends, HTTPException, status');
    lines.push('from sqlalchemy.orm import Session');
    lines.push('from typing import List');
    lines.push('');
    lines.push('from ..db.session import get_db');
    lines.push('');

    const prefix = kebabCase(template.feature_name);
    lines.push('router = APIRouter(prefix="/' + prefix + '", tags=["' + template.feature_name + '"])');
    lines.push('');

    for (const route of template.backend.routes) {
      const modelName = this.extractModelName(route.handler_name);
      const method = route.method.toLowerCase();
      const authDep = route.auth_required ? '\n    current_user = Depends(get_current_user)' : '';

      lines.push('@router.' + method + '("' + route.path + '")');
      lines.push('async def ' + route.handler_name + '(');
      if (route.path.includes(':id')) {
        lines.push('    id: int,');
      }
      lines.push('    db: Session = Depends(get_db)' + authDep);
      lines.push('):');
      lines.push('    """' + route.handler_name + '"""');

      // Handle handler logic
      if (route.handler_logic?.type === 'ai') {
        const result = await this.aiGenerator.generate(route.handler_logic.ai_request!);
        lines.push('    ' + result.code.split('\n').join('\n    '));
      } else {
        lines.push('    pass');
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private async generateServiceFile(service: any, template: FeatureTemplate): Promise<string> {
    const fileName = 'app/services/' + kebabCase(service.name) + '.py';

    const lines: string[] = [];
    lines.push('# File: ' + fileName);
    lines.push('# ============================================================================');
    lines.push('# ' + service.name + ' Service');
    lines.push('# ============================================================================');
    lines.push('');

    lines.push('class ' + service.name + 'Service:');
    lines.push('    """' + service.description + '"""');

    for (const method of service.methods) {
      lines.push('');
      await this.generateServiceMethod(lines, method as MethodTemplate, template);
    }

    return lines.join('\n');
  }

  private async generateServiceMethod(lines: string[], method: MethodTemplate, template: FeatureTemplate): Promise<void> {
    lines.push('    def ' + method.name + '(self' +
      (method.async ? ', ' : ', ') +
      'db: Session):');
    lines.push('        """' + method.description + '"""');

    if (method.logic?.type === 'ai') {
      // AI 生成
      const result = await this.aiGenerator.generate(method.logic.ai_request!);
      const indentedCode = result.code.split('\n').map((l: string) => '        ' + l).join('\n');
      lines.push(indentedCode);
    } else if (method.logic?.type === 'template') {
      // 模板片段
      const model = template.backend.models[0]?.name || 'Model';
      const snippet = fillSnippet(method.logic.impl!, {
        method_name: method.name,
        model: model,
        description: method.description,
      });
      const indentedCode = snippet.split('\n').map((l: string) => '        ' + l).join('\n');
      lines.push(indentedCode);
    } else if (method.logic?.type === 'hybrid') {
      // Hybrid: 先用模板再用 AI
      if (method.logic.impl) {
        const model = template.backend.models[0]?.name || 'Model';
        const snippet = fillSnippet(method.logic.impl, {
          method_name: method.name,
          model: model,
          description: method.description,
        });
        const indentedCode = snippet.split('\n').map((l: string) => '        ' + l).join('\n');
        lines.push(indentedCode);
      }
      if (method.logic.ai_request) {
        const result = await this.aiGenerator.generate(method.logic.ai_request);
        const indentedCode = result.code.split('\n').map((l: string) => '        ' + l).join('\n');
        lines.push(indentedCode);
      }
    } else {
      // 无 logic 定义，生成 pass
      lines.push('        pass');
    }
  }

  private generateFieldDef(field: any): string {
    const pythonType = this.mapTypeToPython(field.type);
    const constraints: string[] = [];

    if (field.foreign_key) {
      constraints.push('ForeignKey(\'' + field.foreign_key + '\')');
    }
    if (field.index) {
      constraints.push('index=True');
    }
    if (field.nullable) {
      constraints.push('nullable=True');
    }
    if (field.default) {
      constraints.push('default=' + field.default);
    }

    const constraintStr = constraints.length > 0 ? ', ' + constraints.join(', ') : '';
    return '    ' + field.name + ' = Column(' + pythonType + constraintStr + ')';
  }

  private extractModelName(handlerName: string): string {
    const prefixes = ['create_', 'get_', 'update_', 'delete_', 'mark_'];
    for (const prefix of prefixes) {
      if (handlerName.startsWith(prefix)) {
        return pascalCase(handlerName.replace(prefix, '').replace(/_([a-z])/g, (_, c) => c.toUpperCase()));
      }
    }
    return 'Item';
  }

  private mapTypeToPython(type: string): string {
    return getPythonType(type as any) || 'str';
  }
}
