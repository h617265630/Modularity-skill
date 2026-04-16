// ============================================================================
// 模板代码片段库 - Modularity-skill
// 预定义可复用的代码片段，用于 template 模式生成
// ============================================================================
/**
 * 模板片段注册表
 */
export const TEMPLATE_SNIPPETS = {
    // ==========================================================================
    // Python/Backend 片段
    // ==========================================================================
    /**
     * 计数聚合 - 统计目标实体的数量
     */
    count_aggregation: `
def {method_name}(self, db: Session, target_type: str, target_id: int) -> int:
    """Count {description} for target"""
    return db.query({model}).filter(
        {model}.target_type == target_type,
        {model}.target_id == target_id
    ).count()
`,
    /**
     * 权限检查 - 验证用户是否为资源所有者
     */
    ownership_check: `
def {method_name}(self, resource: {model}, user_id: int) -> bool:
    """Check if user owns the resource"""
    return resource.user_id == user_id
`,
    /**
     * 软删除 - 标记资源为已删除
     */
    soft_delete: `
def {method_name}(self, db: Session, resource_id: int, user_id: int) -> Optional[{model}]:
    """Soft delete the resource"""
    resource = db.query({model}).filter({model}.id == resource_id).first()
    if not resource:
        return None
    if resource.user_id != user_id:
        raise PermissionError("Not authorized to delete this resource")
    resource.is_deleted = True
    resource.deleted_at = datetime.utcnow()
    resource.deleted_by = user_id
    db.commit()
    db.refresh(resource)
    return resource
`,
    /**
     * 分页查询 - 基础分页模式
     */
    paginated_query: `
def {method_name}(self, db: Session, skip: int = 0, limit: int = 20) -> List[{model}]:
    """Get paginated results"""
    return db.query({model}).offset(skip).limit(limit).all()
`,
    /**
     * 游标分页处理器 - 基础游标分页
     */
    cursor_pagination_handler: `
async def {handler_name}(
    request: Request,
    db: Session = Depends(get_db),
    cursor: Optional[str] = None,
    limit: int = 20
):
    """Get paginated results with cursor pagination"""
    # Parse cursor (base64 encoded id)
    if cursor:
        try:
            cursor_id = int(base64.b64decode(cursor).decode())
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid cursor")
    else:
        cursor_id = None

    query = db.query({model})
    if cursor_id:
        query = query.filter({model}.id < cursor_id)
    results = query.order_by({model}.id.desc()).limit(limit + 1).all()

    has_more = len(results) > limit
    items = results[:limit]

    next_cursor = None
    if has_more and items:
        next_cursor = base64.b64encode(str(items[-1].id).encode()).decode()

    return {{
        "items": items,
        "next_cursor": next_cursor,
        "has_more": has_more
    }}
`,
    /**
     * 创建资源 - 标准创建模式
     */
    create_resource: `
def {method_name}(self, db: Session, obj_in: dict, user_id: int) -> {model}:
    """Create new resource"""
    db_obj = {model}(**obj_in)
    db_obj.created_by = user_id
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
`,
    /**
     * 更新资源 - 标准更新模式
     */
    update_resource: `
def {method_name}(self, db: Session, db_obj: {model}, obj_in: dict) -> {model}:
    """Update existing resource"""
    for field, value in obj_in.items():
        if hasattr(db_obj, field):
            setattr(db_obj, field, value)
    if hasattr(db_obj, "updated_at"):
        db_obj.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_obj)
    return db_obj
`,
    // ==========================================================================
    // TypeScript/Frontend 片段
    // ==========================================================================
    /**
     * 基础数据获取 Hook - 带加载状态
     */
    basic_fetch_hook: `
export function use{hook_name}(params: {params_type}) {{
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {{
    async function fetchData() {{
      setLoading(true);
      setError(null);
      try {{
        const response = await api.get(params);
        setData(response.data);
      }} catch (err) {{
        setError(err instanceof Error ? err.message : 'Unknown error');
      }} finally {{
        setLoading(false);
      }}
    }}
    fetchData();
  }}, [params]);

  return {{ data, loading, error }};
}}
`,
    /**
     * 乐观更新 Hook - 带回滚支持
     */
    optimistic_update_hook: `
export function use{hook_name}(initialData?: any) {{
  const [data, setData] = useState<any>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (input: any) => {{
    const previousData = data;
    // Optimistic update
    setData(input);
    setLoading(true);
    setError(null);

    try {{
      const response = await api.update(input);
      setData(response.data);
      return response.data;
    }} catch (err) {{
      // Rollback on error
      setData(previousData);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }} finally {{
      setLoading(false);
    }}
  }};

  return {{ data, loading, error, mutate }};
}}
`,
    /**
     * 列表数据 Hook - 带分页
     */
    list_fetch_hook: `
export function use{hook_name}(initialParams?: any) {{
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const loadMore = async () => {{
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);
    try {{
      const params = {{ ...initialParams, cursor }};
      const response = await api.list(params);
      setItems(prev => [...prev, ...response.data.items]);
      setHasMore(response.data.has_more);
      setCursor(response.data.next_cursor);
    }} catch (err) {{
      setError(err instanceof Error ? err.message : 'Unknown error');
    }} finally {{
      setLoading(false);
    }}
  }};

  const reset = () => {{
    setItems([]);
    setCursor(null);
    setHasMore(true);
  }};

  return {{ items, loading, error, hasMore, loadMore, reset }};
}}
`,
    /**
     * 表单提交 Hook - 带验证
     */
    form_submit_hook: `
export function use{hook_name}(onSuccess?: (data: any) => void) {{
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({{}});

  const submit = async (data: any) => {{
    setLoading(true);
    setError(null);
    setValidationErrors({{}});

    try {{
      const response = await api.create(data);
      onSuccess?.(response.data);
      return response.data;
    }} catch (err: any) {{
      if (err.response?.data?.validation_errors) {{
        setValidationErrors(err.response.data.validation_errors);
      }}
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }} finally {{
      setLoading(false);
    }}
  }};

  return {{ submit, loading, error, validationErrors }};
}}
`,
};
/**
 * 填充模板片段
 */
export function fillSnippet(snippetName, params) {
    let snippet = TEMPLATE_SNIPPETS[snippetName];
    if (!snippet) {
        return `pass  # Unknown snippet: ${snippetName}`;
    }
    for (const [key, value] of Object.entries(params)) {
        snippet = snippet.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
    }
    return snippet;
}
//# sourceMappingURL=template-snippets.js.map