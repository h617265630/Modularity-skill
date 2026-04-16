// ============================================================================
// 后端代码生成器 - Modularity-skill
// 生成带文件标记的模块化代码
// ============================================================================

import { FeatureTemplate, TechStack } from '../core/types.js';

export class BackendGenerator {
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
    parts.push(this.generateRoutesFile(template));

    // 5. 生成 Service 文件
    for (const service of template.backend.services) {
      parts.push(this.generateServiceFile(service));
    }

    return parts.join('\n');
  }

  private generateModelFile(model: any): string {
    const fileName = 'app/models/' + this.kebabCase(model.name) + '.py';
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
    const fileName = 'app/schemas/' + this.kebabCase(model.name) + '.py';
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
    const fileName = 'app/cruds/' + this.kebabCase(curd.model_name) + '_crud.py';
    const modelVar = this.kebabCase(curd.model_name);

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

  private generateRoutesFile(template: FeatureTemplate): string {
    const fileName = 'app/api/' + this.kebabCase(template.feature_name) + '.py';

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

    const prefix = this.kebabCase(template.feature_name);
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
      lines.push('    pass');
      lines.push('');
    }

    return lines.join('\n');
  }

  private generateServiceFile(service: any): string {
    const fileName = 'app/services/' + this.kebabCase(service.name) + '.py';

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
      lines.push('    def ' + method.name + '(self):');
      lines.push('        """' + method.description + '"""');
      lines.push('        pass');
    }

    return lines.join('\n');
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
        return this.capitalize(handlerName.replace(prefix, '').replace(/_([a-z])/g, (_, c) => c.toUpperCase()));
      }
    }
    return 'Item';
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private kebabCase(s: string): string {
    return s.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();
  }

  private mapTypeToPython(type: string): string {
    const map: Record<string, string> = {
      'string': 'str',
      'text': 'str',
      'integer': 'int',
      'boolean': 'bool',
      'datetime': 'datetime',
      'json': 'dict',
      'int': 'int',
      'str': 'str',
      'bool': 'bool',
      'float': 'float',
    };
    return map[type] || 'str';
  }
}
