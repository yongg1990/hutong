import type { AxiosAdapter } from 'axios';
import { demo, now, nextId, eventNames, submitStaticEvent, staticLineage, confirmProof, activity, runStaticJob, findBatch, staticSchema } from '../stores/demoStore';

type Row = Record<string, any>;
const clone = (value: any) => JSON.parse(JSON.stringify(value));
function matchesRule(value: string, json: string) {
  const rule = JSON.parse(json || '{}');
  return (!rule.pattern || new RegExp(rule.pattern).test(value)) && (rule.minLength == null || value.length >= rule.minLength) && (rule.maxLength == null || value.length <= rule.maxLength) && (rule.length == null || value.length === rule.length) && (!Array.isArray(rule.enum) || rule.enum.includes(value));
}
function required(rows: Row[], id: string, keys = ['id']): Row {
  const row = rows.find(item => keys.some(key => String(item[key]) === id));
  if (!row) throw new Error(`未找到记录 ${id}`); return row;
}
const eventPaths: Record<string, string> = { plantings: 'PLANTED', 'farming-operations': 'FARMING_OPERATION', 'input-applications': 'INPUT_APPLIED', harvests: 'HARVESTED', 'primary-processes': 'PRIMARY_PROCESSED', 'quality-inspections': 'QUALITY_INSPECTED', 'trace-code-assignments': 'TRACE_CODE_ASSIGNED', 'supply-orders': 'ORDER_CONFIRMED', 'warehouse-receipts': 'WAREHOUSED', 'warehouse-issues': 'OUTBOUND_COMPLETED', 'supply-deliveries': 'DELIVERY_COMPLETED', pledges: 'PLEDGE_CONFIRMED', prescriptions: 'PRESCRIPTION_RECEIVED', 'decoction-processes': 'DECOCTION_PROCESSED', 'decoction-deliveries': 'DECOCTION_DELIVERED' };
function handle(method: string, path: string, data: Row, params: Row): any {
  const post = method !== 'get';
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  if (path === '/tenant-access/auth/login') return { token: 'static-session', expiresIn: 86400, user: { id: '1', username: data.username, realName: '静态业务管理员', tenantId: '1', tenantName: '中药互认示范机构', roles: ['ADMIN'], permissions: ['*'] } };
  if (path === '/tenant-access/auth/logout') return { success: true };
  if (path === '/field/batches') return demo.fields;
  if (path === '/process-quality/batches') return demo.processes;
  if (path === '/coding/pieces') return demo.pieces;
  if (path === '/supply/orders') return demo.orders;
  if (path === '/decoction/orders') return demo.prescriptions;
  if (path.startsWith('/supply-chain/')) return submitStaticEvent({ ...data, eventType: eventPaths[parts[1]] });
  if (path === '/openapi/v1/event-fact/events' && post) return submitStaticEvent(data);
  if (/\/event-fact\/events\/[^/]+$/.test(path)) {
    const event = required(demo.events, parts.at(-1)!, ['eventId']);
    return { ...event, id: event.eventId, sourceBusinessKey: event.businessKey, processingStatus: event.processStatus, payloadJson: JSON.stringify(event.payload) };
  }
  if (path.startsWith('/exchange-query/lineage/')) return staticLineage(parts[2], parts[3], params.maxDepth, params.maxNodes);
  if (path === '/openapi/v1/trace-codes') {
    const batchNo = findBatch(String(data.batchId)), piece = demo.pieces.find(r => r.batchNo === batchNo);
    if (!piece) throw new Error('请先完成该批次赋码事件');
    if (demo.traceCodes.some(r => r.code === data.code)) throw new Error('追溯码已登记');
    if (data.parentCode && !demo.traceCodes.some(r => r.code === data.parentCode && r.batchNo === batchNo)) throw new Error('请先登记该批次父级码');
    const id = nextId(); demo.traceCodes.push({ ...data, id, batchNo }); piece.traceCodeCount++;
    activity('追溯码登记', `${batchNo} / ${data.code}`); return { traceCodeRecordId: id };
  }
  if (path === '/openapi/v1/evidence' && post) {
    const id = nextId(); const evidence = { ...data, id, evidenceId: id, name: data.externalUriRef || `证据-${id}`, type: data.evidenceType, fileHash: data.contentDigest || `STATIC-EVIDENCE-${id}`, contentDigest: data.contentDigest || `STATIC-EVIDENCE-${id}`, batchNo: data.subjectType === 'EVENT' ? demo.events.find(r => r.eventId === data.subjectId)?.payload.batchNo : findBatch(data.subjectId), status: 'ACTIVE', uploadTime: now() };
    demo.evidences.unshift(evidence); activity('证据登记', evidence.name); return evidence;
  }
  if (/\/evidence\/[^/]+$/.test(path)) return required(demo.evidences, parts.at(-1)!, ['id', 'evidenceId']);
  if (path === '/openapi/v1/proofs/verify') {
    const proof = demo.proofs.find(r => r.subjectType === data.subjectType && r.subjectId === data.subjectId);
    const evidence = demo.evidences.find(r => r.subjectType === data.subjectType && String(r.subjectId) === data.subjectId);
    const event = demo.events.find(r => r.eventId === data.subjectId);
    const expected = data.subjectType === 'FILE' ? demo.files.find(r => r.fileId === data.subjectId)?.contentDigest : evidence?.contentDigest || event?.payloadDigest;
    const matched = proof?.proofStatus === 'CONFIRMED' && (!data.digest || data.digest.replace(/^sha256:/, '') === String(expected).replace(/^sha256:/, ''));
    return { matched, verified: matched, result: matched ? '静态记录一致' : '尚未完成模拟存证或摘要不一致', simulation: true };
  }
  if (path === '/openapi/v1/proofs' && post) {
    const subjects: Record<string, Row[]> = { EVENT: demo.events, OBJECT: demo.collections['business-objects'], FILE: demo.files, PROJECTION: demo.projections, BATCH: demo.fields };
    if (!(subjects[data.subjectType] || []).some(r => [r.id, r.eventId, r.objectId, r.fileId, r.projectionId, r.batchNo].includes(data.subjectId))) throw new Error('存证主体不存在');
    let proof = demo.proofs.find(r => r.subjectType === data.subjectType && r.subjectId === data.subjectId);
    if (!proof) { proof = { ...data, proofRecordId: nextId(), proofStatus: 'PENDING', chainRecords: [] }; demo.proofs.push(proof); }
    activity('模拟存证任务创建', `${data.subjectType} / ${data.subjectId}`); return proof;
  }
  if (/\/proofs\/[^/]+\/(process|retry|reconcile)$/.test(path)) {
    const proof = required(demo.proofs, parts[3], ['proofRecordId']); confirmProof(proof); activity('模拟存证完成', proof.subjectId); return proof;
  }
  if (/\/proofs\/[^/]+\/[^/]+$/.test(path)) {
    const proof = demo.proofs.find(r => r.subjectType === parts[3] && r.subjectId === parts[4]);
    if (!proof) return { subjectType: parts[3], subjectId: parts[4], proofStatus: 'PENDING', chainRecords: [] };
    return { ...proof, chainRecords: proof.chainRecords.filter((r: Row) => !params.chainType || r.chainType === params.chainType) };
  }
  if (path === '/exchange-query/projections' && post) {
    if (!demo.collections.profiles.some(r => r.profileCode === data.profileCode)) throw new Error('规范包不存在');
    const output = data.subjectIds.flatMap((id: string) => data.subjectType === 'EVENT' ? [required(demo.events, id, ['eventId'])] : demo.events.filter(e => e.payload.batchNo === findBatch(id)));
    if (!output.length) throw new Error('所选主体没有业务事件');
    const id = nextId(), row = { ...data, projectionId: id, profileVersionId: '1', datasetCode: data.datasetCodes?.[0] || 'PIECE_TRACE', status: 'GENERATED', output: clone(output), recordCount: output.length, outputDigest: `STATIC-PROJECTION-${id}`, traceback: output.map((r: Row) => ({ eventId: r.eventId, batchNo: r.payload.batchNo })), errors: [], asOfTime: data.asOfTime || now() };
    demo.projections.unshift(row); activity('互通投影生成', id); return row;
  }
  if (/\/projects\/[^/]+\/projections\/[^/]+\/process$/.test(path)) { const r = required(demo.projections, parts[4], ['projectionId']); r.status = 'GENERATED'; return r; }
  if (/^\/exchange-query\/projections\/[^/]+$/.test(path)) return required(demo.projections, parts[2], ['projectionId']);
  if (/^\/exchange-query\/(objects|events)\//.test(path)) {
    const id = parts[2]; return parts[1] === 'objects' ? required(demo.collections['business-objects'], id, ['id', 'objectId']) : required(demo.events, id, ['eventId']);
  }
  if (path.startsWith('/exchange-query/metadata/profiles/')) return required(demo.collections.profiles, parts.at(-1)!, ['profileCode']);
  if (path === '/openapi/v1/mappings/test') {
    const source = data.sourceSample || {}, mappedPayload = Object.fromEntries(Object.entries(source).map(([k, v]) => [k.replace(/_([a-z])/g, (_: string, s: string) => s.toUpperCase()), v === '公斤' ? 'kg' : v]));
    return { passed: true, mappedEventType: data.targetEventType, mappingProfileVersion: data.mappingProfileVersion, targetSchemaVersion: data.targetSchemaVersion, mappedPayload, issues: [], governanceTickets: [] };
  }
  if (path === '/openapi/v1/raw-records') { const id = nextId(), row = { ...data, rawRecordId: id, contentDigest: `STATIC-RAW-${id}`, status: 'PRESERVED', duplicate: false }; demo.rawRecords.push(row); return row; }
  if (/\/raw-records\/[^/]+\/replays$/.test(path)) {
    const raw = required(demo.rawRecords, parts[3], ['rawRecordId']);
    const event = submitStaticEvent({ eventType: 'RAW_REPLAYED', sourceBusinessKey: `RAW-${raw.rawRecordId}-${params.mappingVersion}`, schemaVersion: '1.0.0', payload: { ...JSON.parse(raw.rawPayload || '{}'), batchNo: findBatch() } });
    return { replayId: nextId(), rawRecordId: raw.rawRecordId, mappingVersion: params.mappingVersion, status: 'COMPLETED', requestedAt: now(), eventId: event.eventId };
  }
  if (path === '/openapi/v1/batches') { const id = nextId(), row = { ...data, batchId: id, batchStatus: 'COMPLETED', totalRecords: data.expectedRecordCount || '1', successRecords: data.expectedRecordCount || '1', failedRecords: '0', processedAt: now(), acceptedAt: now(), failedRecordDetails: [] }; demo.batches.unshift(row); return row; }
  if (/\/batches\/[^/]+$/.test(path)) return required(demo.batches, parts.at(-1)!, ['batchId']);
  if (path === '/workspace/stats') return { pendingGovernanceCases: demo.cases.filter(r => r.status !== 'RESOLVED').length, processingIngestBatches: demo.batches.filter(r => r.batchStatus !== 'COMPLETED').length, pendingProofs: demo.proofs.filter(r => r.proofStatus !== 'CONFIRMED').length, todayAcceptedEvents: demo.events.filter(r => r.occurredAt.startsWith(now().slice(0, 10))).length, todaySuccessRate: '100%' };
  if (path === '/workspace/activities') return demo.activities;
  if (path === '/workspace/work-items') return demo.cases.filter(r => r.status !== 'RESOLVED').map(r => ({ id: r.id, type: 'GOVERNANCE_CASE', typeCode: r.ruleCode, title: r.errorDetail, subjectId: r.id, status: 'PENDING', occurredAt: r.createdAt, source: r.sourceSystem, route: '/governance/cases', severity: 'high' }));
  if (path === '/operations/jobs') return demo.jobs;
  if (/\/jobs\/[^/]+\/trigger$/.test(path)) { runStaticJob(parts[2]); return { success: true, jobId: parts[2] }; }
  if (path === '/operations/audit-alerts') return demo.alerts;
  if (/\/alerts\/[^/]+\/actions$/.test(path)) {
    const row = required(demo.alerts, parts[3], ['alertId']);
    if (row.lockVersion !== data.lockVersion) throw new Error('记录已更新，请重新选择');
    Object.assign(row, { status: data.action === 'CLOSE' ? 'CLOSED' : 'ACKNOWLEDGED', isResolved: data.action === 'CLOSE', lockVersion: row.lockVersion + 1, resolutionNote: data.resolutionNote }); activity('告警处理', row.alertId); return row;
  }
  if (path === '/admin/v1/subscriptions') { const id = nextId(), row = { ...data, id, subscriptionId: id }; demo.subscriptions.push(row); demo.deliveries.push({ messageId: id, subscriptionId: id, status: 'PENDING', lockVersion: 0, attempts: [] }); return row; }
  if (/\/callback-deliveries\//.test(path)) { const row = required(demo.deliveries, parts[3], ['messageId']); if (post) { if(row.lockVersion!==data.lockVersion)throw new Error('记录已更新，请重新查询');row.status = 'DELIVERED'; row.lockVersion++; row.attempts.push({ attemptedAt: now(), result: '静态回执成功', reason:data.reason }); } return row; }
  if (path === '/openapi/v1/files/upload-sessions') { const id = nextId(), row = { ...data, uploadSessionId: id, fileId: nextId(), uploadStatus: 'CREATED', uploadUrl: `static://upload/${id}` }; demo.uploadSessions.push(row); return row; }
  if (/\/files\/upload-sessions\//.test(path)) {
    const row = required(demo.uploadSessions, parts[4], ['uploadSessionId']);
    if (post) { if (!row.transferred) throw new Error('请先选择并传输文件'); Object.assign(row, { uploadStatus: 'COMPLETED', objectVersion: data.objectVersion }); const file = { ...row, id: row.fileId, status: 'AVAILABLE' }; demo.files.push(file); return file; } return row;
  }
  if (/\/files\/[^/]+$/.test(path)) return required(demo.files, parts.at(-1)!, ['fileId']);
  if (path.includes('/event-fact/')) {
    if (path.endsWith('/event-types')) {
      const rows = demo.collections['event-types'] ||= Object.keys(eventNames).map((eventType, i) => ({ id: String(i + 1), eventType, eventName: eventNames[eventType], status: 'ACTIVE' }));
      return post ? saveCollection('event-types', data) : page(rows, params);
    }
    if (path.endsWith('/test')) return { valid: true, errors: [] };
    if (/\/event-types\/\d+(?:\/status)?$/.test(path)) return post ? saveCollection('event-types', data, parts[4]) : required(demo.collections['event-types'] || [], parts[4]);
    if (path.includes('/schemas/definitions')) {
      const rows = demo.collections.schemas ||= Object.keys(eventNames).map((eventType,i) => { const schema=staticSchema(eventType);return {id:String(1100+i),eventType,schemaVersion:'1.0.0',status:'PUBLISHED',lockVersion:0,fields:Object.entries(schema.jsonSchema.properties).filter(([key])=>!key.endsWith('Grid')).map(([fieldName,value]:[string,any])=>({fieldName,displayName:value.title,dataType:value.type==='number'?'DECIMAL':'STRING',required:schema.jsonSchema.required.includes(fieldName)})),referenceRules:[]}; }); const id = parts[5];
      if (path.endsWith('/publish')) { const row = required(rows, id); row.status = 'PUBLISHED'; return row; }
      if (post) return saveCollection('schemas', { status: 'DRAFT', ...data }, id);
      return id ? required(rows, id) : page(rows.filter(r => !params.eventType || r.eventType === params.eventType), params);
    }
  }
  // Generic local CRUD supports the existing master-data and configuration forms.
  const prefix = path.startsWith('/openapi/v1/') ? 2 : 1;
  let name = parts[prefix], id = parts[prefix + 1], action = parts[prefix + 2];
  if (name === 'identifiers') { name += '/' + id; id = parts[prefix + 2]; action = parts[prefix + 3]; }
  if (name === 'identifiers/resolve') {
    const bindings = demo.collections['identifiers/bindings'].filter(r => ['sourceSystemId', 'namespaceCode', 'identifierValue', 'targetType'].every(key => String(r[key]) === String(data[key])));
    const active = bindings.filter(r => r.status === 'ACTIVE' && (!r.validFrom || r.validFrom <= now()) && (!r.validTo || r.validTo >= now()));
    const candidateIds = [...new Set(active.map(r => String(r.targetId)))];
    return { resolutionStatus: candidateIds.length > 1 ? 'AMBIGUOUS' : candidateIds.length ? 'RESOLVED' : bindings.length ? 'INACTIVE' : 'NOT_FOUND', targetId: candidateIds.length === 1 ? candidateIds[0] : undefined, candidateIds };
  }
  if (name === 'permissions' && id === 'tree') return demo.collections.permissions;
  if (name === 'code-schemes' && id === 'validate') {
    const scheme = demo.collections[name].find(r => r.schemeCode === data.schemeCode);
    if (!scheme) throw new Error('编码体系不存在');
    const normalizedCode = String(data.rawCode || '').trim();
    const segments = (demo.collections[`code-schemes-${scheme.id}-segments`] || []).map(r => { const value = normalizedCode.slice(r.startPos - 1, r.startPos - 1 + r.segmentLength);return {segmentNo:r.segmentNo,semanticCode:r.semanticCode,value,valid:value.length===r.segmentLength && matchesRule(value,r.ruleJson)}; });
    const valid = scheme.status === 'ACTIVE' && Boolean(normalizedCode) && matchesRule(normalizedCode, scheme.validationJson) && segments.every(r => r.valid);
    return { schemeCode: scheme.schemeCode, valid, normalizedCode, segments, errorCode: valid ? undefined : 'CODE_RULE_MISMATCH' };
  }
  const child: Record<string, [string, string]> = { 'profiles/versions': ['profile-versions', 'profileId'], 'profile-versions/datasets': ['datasets', 'profileVersionId'], 'profile-versions/conformance-cases': ['conformance-cases', 'profileVersionId'], 'datasets/field-rules': ['field-rules', 'datasetId'], 'projects/bindings': ['bindings', 'projectSpaceId'] };
  if (child[`${name}/${action}`]) { const [key, foreign] = child[`${name}/${action}`]; return (demo.collections[key] || []).filter(r => String(r[foreign]) === id); }
  if (name === 'profile-versions' && ['test', 'publish'].includes(action)) { const row = required(demo.collections[name], id); if (action === 'publish') row.status = 'PUBLISHED'; return { ...row, passed: true, errors: [] }; }
  if (['roles', 'users'].includes(name) && ['permissions', 'roles'].includes(action)) {
    const row = required(demo.collections[name], id, ['id', 'roleId', 'userId']);
    if (post) { const values=data.permissionCodes || data.roleIds || []; row[action] = parts.at(-1)==='delete' ? (row[action]||[]).filter((v:string)=>!values.includes(v)) : [...new Set([...(action==='roles'?row[action]||[]:[]),...values])]; return row; }
    if (action === 'permissions') return (demo.collections.permissions || []).map(r => ({ ...r, granted: (row.permissions || []).includes(r.permissionCode) }));
    return (demo.collections[action] || []).filter(r => (row[action] || []).includes(String(r.id)));
  }
  if (['value-sets', 'code-schemes', 'dictionaries'].includes(name) && ['items', 'segments'].includes(action)) {
    const key = `${name}-${id}-${action}`, childId = parts[prefix + 3];
    if (post && parts.at(-1) === 'delete') { const rows = demo.collections[key] || [];const index = rows.findIndex(r => r.id === childId);if(index<0)throw new Error('记录不存在');rows.splice(index,1);return {success:true}; }
    if (post) return saveCollection(key, data, childId);
    const items=demo.collections[key] || [];
    if(childId && childId!=='active')return required(items,childId);
    return ['dictionaries','value-sets'].includes(name) && childId!=='active' ? page(items,params) : items.filter(r=>childId!=='active'||r.status==='ACTIVE');
  }
  if (!(name in demo.collections)) throw new Error(`静态模式暂不支持此操作：${path}`);
  const rows = demo.collections[name];
  if (action === 'delete') { const row = required(rows, id); if (['code-schemes', 'decoction-piece-products'].includes(name)) row.status = 'INACTIVE';else rows.splice(rows.indexOf(row),1);return { success: true }; }
  if (post) return saveCollection(name, data, id === 'tenant' ? undefined : id);
  if (id && id !== 'page') return required(rows, id, ['id', 'projectSpaceId', 'sourceSystemId', 'productId', 'namespaceId', 'objectId', 'bindingId', 'deploymentInstanceId']);
  const filtered = rows.filter(r => Object.entries(params).every(([key, value]) => !value || ['page', 'size', 'limit'].includes(key) || r[key] == null || String(r[key]).includes(String(value))));
  return path.startsWith('/exchange-query/') || (['users', 'roles', 'permissions'].includes(name) && id !== 'page') ? filtered : page(filtered, params);
}
function page(rows: Row[], params: Row) { const page = Number(params.page || 1), size = Number(params.size || 20); return { records: rows.slice((page - 1) * size, page * size), total: rows.length, page, size }; }
function saveCollection(name: string, data: Row, id?: string) {
  const rows = demo.collections[name] ||= [], existing = id ? required(rows, id) : null;
  const value = id || nextId();
  const row: Row = { ...(existing || {}), ...data, id: value, updatedAt: now(), createdAt: existing?.createdAt || now(), lockVersion: Number(existing?.lockVersion || 0) + 1 };
  const idKeys: Record<string, string> = { parties: 'partyId', 'business-objects': 'objectId', 'source-systems': 'sourceSystemId', 'project-spaces': 'projectSpaceId', 'identifiers/namespaces': 'namespaceId', 'identifiers/bindings': 'bindingId', 'deployment-instances': 'deploymentInstanceId', 'decoction-piece-products': 'productId', tenants: 'tenantId', users: 'userId', roles: 'roleId', permissions: 'permissionId' };
  Object.assign(idKeys, { 'code-schemes':'schemeId', 'value-sets':'valueSetId', credentials:'credentialId' });
  if (idKeys[name]) row[idKeys[name]] = value;
  if(name.startsWith('code-schemes-')){row.segmentId=value;row.schemeId=name.slice('code-schemes-'.length,-'-segments'.length);}
  if(name.startsWith('value-sets-')){row.itemId=value;row.valueSetId=name.slice('value-sets-'.length,-'-items'.length);}
  if(name==='dictionaries')row.dictionaryTypeId=value;
  if(name.startsWith('dictionaries-')){row.dictionaryItemId=value;row.dictionaryCode=name.split('-')[1];}
  row.status ||= 'ACTIVE';
  if (name === 'business-objects') { row.currentVersionNo = Number(existing?.currentVersionNo || 0) + 1; row.currentAttributes = data.attributes; }
  if (existing) Object.assign(existing, row); else rows.unshift(row);
  activity('记录保存', name + ' / ' + value); return row;
}
export const staticAdapter: AxiosAdapter = async config => {
  try {
    const url = new URL(String(config.url), 'http://static.local');
    const params = { ...Object.fromEntries(url.searchParams.entries()), ...config.params };
    const data = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data || {};
    const result = handle(config.method || 'get', url.pathname, data, params);
    return { data: clone(result), status: 200, statusText: 'OK', headers: {}, config };
  } catch (error) { throw Object.assign(error instanceof Error ? error : new Error(String(error)), { businessMessage: error instanceof Error ? error.message : String(error), config }); }
};
