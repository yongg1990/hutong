import { reactive, watch } from 'vue';
import { mockFieldBatches, mockPrimaryProcessingBatches, mockHerbPieces, mockSupplyOrders, mockDecoctionOrders, mockGovernanceCases, mockTrustEvents } from '../api/mockData';

type RecordData = Record<string, any>;
const storageKey = 'tcmirp_static_workflow_v1';
export const isStaticMode = () => localStorage.getItem('tcmirp_data_mode') !== 'backend';
export const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
export const eventNames: Record<string, string> = {
  PLANTED: '种植建档', FARMING_OPERATION: '农事作业', INPUT_APPLIED: '投入品施用', HARVESTED: '采收完成',
  PRIMARY_PROCESSED: '初加工完成', QUALITY_INSPECTED: '质量检验', TRACE_CODE_ASSIGNED: '饮片赋码',
  ORDER_CONFIRMED: '订单确认', WAREHOUSED: '入仓完成', OUTBOUND_COMPLETED: '出库完成', DELIVERY_COMPLETED: '交割完成',
  PLEDGE_CONFIRMED: '质押确认', PRESCRIPTION_RECEIVED: '处方接收', DECOCTION_PROCESSED: '代煎加工', DECOCTION_DELIVERED: '配送签收'
};
export const defaultIndicators = () => [{ name: '水分', result: '10.8', unit: '%', limit: '≤14%', status: 'PASS' as const }];
export const defaultItems = () => [{ pieceName: '三七饮片', spec: '蒸制', qty: '15g', insuranceCode: '8691234567890123', usage: '煎服' }];
export function staticSchema(type: string) {
  const labels: Record<string, string> = { batchNo:'关联批次号', herbName:'药材名称', baseName:'种植基地', baseCode:'基地编码', plotCode:'地块', plantDate:'种植日期', plantArea:'种植面积', areaUnit:'面积单位', seedSource:'种苗来源', remark:'作业说明', quantity:'数量', unitCode:'计量单位', processMethod:'加工工艺', freshWeight:'投料鲜重', driedWeight:'产出干重', reportNo:'报告单号', inspectType:'检验类型', inspectDate:'检验日期', conclusion:'检验结论', medicalInsurancePieceCode:'16位医保编码', orderNo:'订单号', warehouseName:'仓库名称', warehouseCode:'仓库编码', inboundNo:'入仓单号', pledgeAmount:'质押金额', hospitalName:'医疗机构', hospitalCode:'医院编码', centerName:'代煎中心', prescriptionNoToken:'脱敏处方编号', deliveryStage:'配送状态' };
  const byType: Record<string, string[]> = { PLANTED:['batchNo','herbName','baseName','baseCode','plotCode','plantDate','plantArea','areaUnit','seedSource'], FARMING_OPERATION:['batchNo','remark'], INPUT_APPLIED:['batchNo','remark','quantity','unitCode'], HARVESTED:['batchNo','quantity','unitCode'], PRIMARY_PROCESSED:['batchNo','herbName','processMethod','freshWeight','driedWeight'], QUALITY_INSPECTED:['batchNo','reportNo','inspectType','inspectDate','conclusion','indicatorsGrid'], TRACE_CODE_ASSIGNED:['batchNo','herbName','quantity','medicalInsurancePieceCode'], ORDER_CONFIRMED:['batchNo','herbName','orderNo','quantity','unitCode','warehouseName','medicalInsurancePieceCode'], WAREHOUSED:['batchNo','warehouseCode','inboundNo','quantity','unitCode'], OUTBOUND_COMPLETED:['batchNo','quantity','unitCode'], DELIVERY_COMPLETED:['batchNo','remark'], PLEDGE_CONFIRMED:['batchNo','pledgeAmount'], PRESCRIPTION_RECEIVED:['batchNo','hospitalName','hospitalCode','centerName','prescriptionNoToken','prescriptionItemsGrid'], DECOCTION_PROCESSED:['batchNo','prescriptionNoToken','remark','prescriptionItemsGrid'], DECOCTION_DELIVERED:['batchNo','prescriptionNoToken','deliveryStage'] };
  const fields = byType[type] || ['batchNo','remark'];
  const enums: Record<string, string[]> = { unitCode:['kg','g','t'], areaUnit:['亩','公顷'], conclusion:['QUALIFIED','UNQUALIFIED'], inspectType:['ROUTINE','FULL_STANDARD','SAMPLING'], deliveryStage:['DELIVERING','COMPLETED'] };
  return { eventType:type,eventTypeName:eventNames[type]||type,schemaVersion:'1.0.0',status:'PUBLISHED',groups:[{code:'BASIC',title:'业务数据',fields}],jsonSchema:{type:'object',required:fields.filter(k=>!['remark','indicatorsGrid','prescriptionItemsGrid'].includes(k)),properties:Object.fromEntries(fields.map(k=>[k,{title:labels[k]||k,type:['quantity','freshWeight','driedWeight','plantArea','pledgeAmount'].includes(k)?'number':'string',...(enums[k]?{enum:enums[k]}:{}),...(k==='plantDate'||k==='inspectDate'?{format:'date'}:{})}]))} };
}
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function seed() {
  const fields = copy(mockFieldBatches).map((r, i) => ({ ...r, id: String(101 + i) }));
  const processes = copy(mockPrimaryProcessingBatches).map((r, i) => ({ ...r, id: String(201 + i), primaryBatchNo: fields[i].batchNo, harvestBatchNo: fields[i].batchNo }));
  fields.slice(0, 4).forEach(r => { r.stage='HARVEST_DONE';r.status='ARCHIVED';r.lastEvent='采收完成'; });
  processes.slice(0, 3).forEach(r => { r.status='INSPECTED'; });
  const pieces = copy(mockHerbPieces).map((r, i) => ({ ...r, id: String(301 + i), batchNo: fields[i].batchNo }));
  const orders = copy(mockSupplyOrders).slice(0, 3).map((r, i) => ({ ...r, id: String(401 + i), batchNo: fields[i].batchNo }));
  const prescriptions = copy(mockDecoctionOrders).map((r, i) => ({ ...r, id: String(501 + i), batchNo: fields[i].batchNo, orderId: orders[i].id, items: defaultItems(), itemCount: 1 }));
  const events = copy(mockTrustEvents).map((r, i) => ({ ...r, eventId: String(1001 + i), schemaVersion: '1.0.0', payload: { ...r.payload, batchNo: fields[0].batchNo } as RecordData, payloadDigest: 'STATIC-SNAPSHOT-' + (1001 + i) }));
  const collections: Record<string, RecordData[]> = {
    parties: [{ id: '1', partyId: '1', partyName: '云南示范中药材种植合作社', partyType: 'PRODUCER', regionCode: '530000', status: 'ACTIVE' }],
    'business-objects': fields.map(r => ({ id: r.id, objectId: r.id, projectSpaceId: '1', objectType: 'CROP_BATCH', sourceBusinessKey: r.batchNo, ownerPartyId: '1', status: 'ACTIVE', currentVersionNo: 1, attributes: r, currentAttributes: r })),
    'source-systems': [{ id: '1', sourceSystemId: '1', sourceSystemCode: 'STATIC', sourceSystemName: '静态协同数据', sourceSystemType: 'ERP', ownerPartyId: '1', endpointType: 'API', status: 'ACTIVE', lockVersion: 0 }],
    'project-spaces': [{ id: '1', projectSpaceId: '1', tenantId: '1', projectCode: 'STATIC-TCM', projectName: '中药互认协同空间', regionCode: '530000', businessScope: { scenarioCodes: ['SUPPLY_CHAIN'], regionCodes: ['530000'], partyIds: ['1'], objectTypes: ['BATCH'] }, status: 'ACTIVE', lockVersion: 0 }],
    'decoction-piece-products': pieces.map(r => ({ id: r.id, productId: r.id, productCode: r.id, productName: r.speciesName, herbName: r.speciesName, processingMethod: r.processMethod, specification: r.spec, medicalInsuranceCode: r.medicalInsuranceCode, status: 'ACTIVE', regulatoryCodes: [] })),
    'identifiers/namespaces': [{ id: '1', namespaceId: '1', namespaceCode: 'BATCH', namespaceName: '业务批次', targetType: 'OBJECT', status: 'ACTIVE' }],
    'identifiers/bindings': [], 'code-schemes': [], 'data-elements': [], 'value-sets': [],
    profiles: [{ id: '1', profileCode: 'SH-PIECE-TRACE', profileName: '中药饮片互认追溯规范包', profileOwner: '中药互认联盟', scenarioCode: 'PIECE_TRACE', status: 'ACTIVE' }],
    'profile-versions': [{ id: '1', profileId: '1', version: '1.0.0', status: 'PUBLISHED' }],
    datasets: [{ id: '1', profileVersionId: '1', datasetCode: 'PIECE_TRACE', datasetName: '中药全链追溯数据集', outputFormat: 'JSON', rootSelector: '$', status: 'ACTIVE' }],
    'field-rules': [], 'conformance-cases': [], bindings: [{ id: '1', projectSpaceId: '1', profileVersionId: '1', status: 'ACTIVE' }],
    tenants: [{ id: '1', tenantId: '1', tenantCode: 'STATIC', tenantName: '中药互认示范机构', tenantType: 'ENTERPRISE', status: 'ACTIVE' }],
    users: [{ id: '1', userId: '1', username: 'admin', displayName: '静态业务管理员', tenantId: '1', status: 'ACTIVE' }],
    roles: [{ id: '1', roleId: '1', tenantId: '1', roleCode: 'ADMIN', roleName: '业务管理员', status: 'ACTIVE' }], permissions: [], dictionaries: [], credentials: [], 'deployment-instances': []
  };
  return {
    sequence: 2000, fields, processes, pieces, orders, prescriptions, events,
    traceCodes: [] as RecordData[], proofs: events.map((event, i) => ({ proofRecordId: String(1501 + i), subjectType: 'EVENT', subjectId: event.eventId, proofStatus: event.proofStatus, targets: [{chainType:'CHANGAN_CHAIN',networkCode:'STATIC'}], chainRecords: [] })) as RecordData[], projections: [] as RecordData[], rawRecords: [] as RecordData[], batches: [] as RecordData[],
    files: [] as RecordData[], uploadSessions: [] as RecordData[], subscriptions: [] as RecordData[], deliveries: [] as RecordData[], mappings: [] as RecordData[],
    evidences: [{ id: '1', evidenceId: '1', name: '三七批次质检报告', type: 'QUALITY_REPORT', evidenceType: 'QUALITY_REPORT', subjectType: 'BATCH', subjectId: fields[0].id, batchNo: fields[0].batchNo, fileHash: 'STATIC-QUALITY-REPORT', contentDigest: 'STATIC-QUALITY-REPORT', status: 'ACTIVE', uploadTime: now() }] as RecordData[],
    cases: copy(mockGovernanceCases).map((r, i) => ({ ...r, id: String(601 + i), rawRecordId: String(701 + i), batchNo: fields[i].batchNo, resolutionNote: '', history: [] as string[] })),
    alerts: [{ alertId: '801', level: 'HIGH', type: 'QUALITY_CHECK', content: '三七批次单位待标准化', occurredAt: now(), status: 'OPEN', isResolved: false, lockVersion: 0 }],
    jobs: [{ jobId: '901', name: '存证补偿与互通投影作业', cronExpr: '手动执行', lastRunTime: '', nextRunTime: '', status: 'PAUSED', runCount: 0 }],
    activities: [] as RecordData[], collections
  };
}
function restore() { try { const raw = localStorage.getItem(storageKey); if (raw) return JSON.parse(raw) as ReturnType<typeof seed>; } catch { /* Use a fresh static workspace if persisted data is invalid. */ } return seed(); }
export const demo = reactive(restore());
watch(demo, () => localStorage.setItem(storageKey, JSON.stringify(demo)), { deep: true, flush: 'sync' });
export function resetStaticData() { Object.assign(demo, seed()); }
export const nextId = () => String(++demo.sequence);
export function activity(title: string, detail: string) { demo.activities.unshift({ id: nextId(), title, detail, time: now(), type: 'EVENT' }); }
export function findBatch(value?: string): string {
  if (!value) return demo.fields[0].batchNo;
  const record = [...demo.fields, ...demo.processes, ...demo.pieces, ...demo.orders, ...demo.prescriptions].find((r: any) => [r.id, r.batchNo, r.primaryBatchNo, r.orderNo, r.prescriptionNoToken].includes(value));
  return (record as any)?.batchNo || (record as any)?.primaryBatchNo || value;
}
export function eventDefaults(type: string, batchValue?: string, prescriptionId?: string): RecordData {
  const batchNo = findBatch(batchValue), field = demo.fields.find(r => r.batchNo === batchNo);
  const order = demo.orders.find(r => r.batchNo === batchNo), prescription = demo.prescriptions.find(r => r.id === prescriptionId) || demo.prescriptions.find(r => r.batchNo === batchNo);
  const isPrescriptionEvent = ['PRESCRIPTION_RECEIVED', 'DECOCTION_PROCESSED', 'DECOCTION_DELIVERED'].includes(type);
  const latest: RecordData = demo.events.find(r => r.eventType === type && r.payload.batchNo === batchNo && (!isPrescriptionEvent || !prescription || r.payload.prescriptionId === prescription.id || r.payload.prescriptionNoToken === prescription.prescriptionNoToken))?.payload || {};
  return { batchNo, cropBatchNo: batchNo, herbName: field?.herbName || '三七', baseCode: 'BASE-WS-01', plotCode: field?.plotName || 'A-16', baseName: field?.baseName || '文山三七示范基地', plantDate: field?.plantDate || now().slice(0, 10), plantArea: 25, areaUnit: '亩', seedSource: '优选种苗', businessKey: '', occurredAt: now(), remark: '', quantity: order?.quantity || 100, unitCode: 'kg', warehouseCode: 'WH-KM-001', warehouseName: '昆明中心仓', inboundNo: `IN-${nextId()}`, inventoryUnitCode: `INV-${batchNo}`, medicalInsurancePieceCode: order?.insuranceCode || '8691234567890123', processMethod: '清洗切片与低温干燥', freshWeight: 1000, driedWeight: 320, reportNo: `QJ-${nextId()}`, inspectType: 'FULL_STANDARD', inspectDate: now().slice(0, 10), conclusion: 'QUALIFIED', hospitalCode: 'HOSP-01', hospitalName: '云南省中医医院', centerName: '昆明智慧代煎中心', prescriptionNoToken: prescription?.prescriptionNoToken || `PRE-${nextId()}****`, patientToken: 'STATIC-PATIENT', prescriptionId: prescription?.id, orderId: order?.id, orderNo: order?.orderNo || `XS-${nextId()}`, pledgeAmount: 10000, deliveryStage: 'COMPLETED', ...copy(latest), indicators: copy(latest.indicators || defaultIndicators()), items: copy(prescription?.items || latest.items || defaultItems()), evidenceIds: copy(latest.evidenceIds || ['1']) };
}

export function submitStaticEvent(command: RecordData) {
  const payload = copy(command.payload || JSON.parse(command.payloadJson || '{}'));
  const type = command.eventType, batchNo = String(payload.batchNo || payload.cropBatchNo || '');
  if (!batchNo) throw new Error('请选择关联批次');
  if (!String(command.sourceBusinessKey || '').trim()) throw new Error('请填写唯一来源业务键');
  if (type === 'QUALITY_INSPECTED' && payload.indicators?.some((r: any) => r.status === 'FAIL')) payload.conclusion = 'UNQUALIFIED';
  const duplicate = demo.events.find(r => r.businessKey === command.sourceBusinessKey);
  if (duplicate) {
    const submittedPayload = copy(duplicate.payload);
    if (type === 'PRESCRIPTION_RECEIVED' && !payload.prescriptionId) delete submittedPayload.prescriptionId;
    if (duplicate.eventType !== type || JSON.stringify(submittedPayload) !== JSON.stringify(payload)) throw new Error('业务键已用于其他内容，请更换业务键');
    return { ...duplicate, id: duplicate.eventId, status: duplicate.processStatus };
  }
  const field = demo.fields.find(r => r.batchNo === batchNo);
  for (const key of ['quantity','freshWeight','driedWeight','plantArea','pledgeAmount']) {
    if (staticSchema(type).groups[0].fields.includes(key) && (!Number.isFinite(Number(payload[key])) || Number(payload[key]) <= 0)) throw new Error('数量、重量、面积和金额必须大于零');
  }
  if (type==='PRIMARY_PROCESSED' && Number(payload.driedWeight)>Number(payload.freshWeight)) throw new Error('产出干重不能大于投料鲜重');
  if (['TRACE_CODE_ASSIGNED','ORDER_CONFIRMED'].includes(type) && !/^\d{16}$/.test(payload.medicalInsurancePieceCode||'')) throw new Error('医保编码须为16位数字');
  if ((payload.evidenceIds||[]).some((id:string)=>!demo.evidences.some(r=>r.evidenceId===id))) throw new Error('所选证据不存在');
  const process = demo.processes.find(r => r.primaryBatchNo === batchNo);
  const piece = demo.pieces.find(r => r.batchNo === batchNo);
  let order = demo.orders.find(r => r.batchNo === batchNo);
  let prescription = demo.prescriptions.find(r => r.id === payload.prescriptionId) || demo.prescriptions.find(r => r.prescriptionNoToken === payload.prescriptionNoToken);
  if (['DECOCTION_PROCESSED', 'DECOCTION_DELIVERED'].includes(type) && prescription && prescription.batchNo !== batchNo) throw new Error('所选处方与批次不一致');
  if (['FARMING_OPERATION', 'INPUT_APPLIED', 'HARVESTED'].includes(type) && !field) throw new Error('请先完成种植建档');
  if (type === 'PRIMARY_PROCESSED' && field?.stage !== 'HARVEST_DONE') throw new Error('请先完成该批次采收');
  if (type === 'QUALITY_INSPECTED' && !process) throw new Error('请先登记初加工');
  if (type === 'QUALITY_INSPECTED' && (!payload.indicators?.length || payload.indicators.some((r: any) => !r.name || !r.result))) throw new Error('请填写完整检验指标');
  if (type === 'TRACE_CODE_ASSIGNED' && process?.status !== 'INSPECTED') throw new Error('请先完成合格质检');
  const expected: Record<string, string[]> = { WAREHOUSED: ['CONFIRMED'], OUTBOUND_COMPLETED: ['WAREHOUSED'], DELIVERY_COMPLETED: ['OUT_BOUND'], PLEDGE_CONFIRMED: ['WAREHOUSED'] };
  if (expected[type] && (!order || !expected[type].includes(order.stage))) throw new Error('当前订单阶段不支持该操作，请按确认、入库、出库、交割顺序处理；质押仅限在库订单');
  if (type === 'ORDER_CONFIRMED' && !piece) throw new Error('请先完成饮片赋码');
  if (type === 'ORDER_CONFIRMED' && order) throw new Error('该批次已有订单，请继续处理已有订单');
  if (type === 'PRESCRIPTION_RECEIVED' && order?.stage !== 'DELIVERED') throw new Error('请先完成供销交割');
  if (['PRESCRIPTION_RECEIVED', 'DECOCTION_PROCESSED'].includes(type) && (!payload.items?.length || payload.items.some((r: any) => !r.pieceName || !r.qty || !/^\d{16}$/.test(r.insuranceCode || '')))) throw new Error('请填写处方饮片、剂量和16位医保编码');
  if (type === 'DECOCTION_PROCESSED' && (!prescription || !['RECEIVED', 'DECOCTING'].includes(prescription.stage))) throw new Error('请选择已接收的处方');
  if (type === 'DECOCTION_DELIVERED' && (!prescription || !['PACKAGING', 'DELIVERING'].includes(prescription.stage))) throw new Error('请先完成代煎加工');
  if (type === 'PLANTED') {
    if (field) throw new Error('该批次已建档，请使用新的批次号');
    demo.fields.unshift({ id: nextId(), batchNo, baseName: payload.baseName || payload.baseCode, plotName: payload.plotCode, herbName: payload.herbName, plantDate: payload.plantDate, lastEvent: '种植建档', stage: 'PLANTING', status: 'GROWING' });
  }
  if (field && ['FARMING_OPERATION', 'INPUT_APPLIED', 'HARVESTED'].includes(type)) {
    field.stage = type === 'HARVESTED' ? 'HARVEST_DONE' : type === 'INPUT_APPLIED' ? 'INPUTS' : 'AGRICULTURAL';
    field.lastEvent = eventNames[type]; field.status = type === 'HARVESTED' ? 'ARCHIVED' : 'GROWING';
  }
  if (type === 'PRIMARY_PROCESSED') {
    const record = { id: process?.id || nextId(), primaryBatchNo: batchNo, harvestBatchNo: batchNo, herbName: payload.herbName, processMethod: payload.processMethod, facilityName: '文山初加工中心', freshWeight: Number(payload.freshWeight), driedWeight: Number(payload.driedWeight), yieldRate: `${(Number(payload.driedWeight) / Number(payload.freshWeight) * 100).toFixed(2)}%`, moistureContent: '待检', impurityContent: '待检', operator: '静态业务操作员', processedAt: command.occurredAt, status: 'COMPLETED' as const };
    if (process) Object.assign(process, record); else demo.processes.unshift(record);
  }
  if (type === 'QUALITY_INSPECTED' && process) {
    payload.conclusion = payload.indicators.some((r: any) => r.status === 'FAIL') ? 'UNQUALIFIED' : payload.conclusion;
    process.status = payload.conclusion === 'QUALIFIED' ? 'INSPECTED' : 'COMPLETED';
  }
  if (type === 'TRACE_CODE_ASSIGNED' && !piece) demo.pieces.unshift({ id: nextId(), batchNo, speciesName: payload.herbName, processMethod: process?.processMethod || '', spec: '1kg/袋', medicalInsuranceCode: payload.medicalInsurancePieceCode, nmpaCode: 'STATIC', packageCount: Number(payload.quantity), traceCodeCount: 0 });
  if (type === 'ORDER_CONFIRMED') { order = { id: nextId(), orderNo: payload.orderNo, batchNo, pieceName: payload.herbName, quantity: Number(payload.quantity), unit: payload.unitCode, warehouse: payload.warehouseName, insuranceCode: payload.medicalInsurancePieceCode, stage: 'CONFIRMED', stockStatus: 'IN_TRANSIT', fulfillmentStatus: 'PENDING_OUT' }; demo.orders.unshift(order); }
  if (order && expected[type]) {
    const stage = { WAREHOUSED: 'WAREHOUSED', OUTBOUND_COMPLETED: 'OUT_BOUND', DELIVERY_COMPLETED: 'DELIVERED', PLEDGE_CONFIRMED: 'PLEDGED' }[type];
    Object.assign(order, { stage, stockStatus: type === 'OUTBOUND_COMPLETED' ? 'IN_TRANSIT' : stage, fulfillmentStatus: type === 'DELIVERY_COMPLETED' ? 'COMPLETED' : type === 'OUTBOUND_COMPLETED' ? 'PENDING_DELIVERY' : 'PENDING_OUT', pledgeAmount: type === 'PLEDGE_CONFIRMED' ? Number(payload.pledgeAmount) : 0 });
  }
  if (type === 'PRESCRIPTION_RECEIVED') {
    if (prescription) throw new Error('处方已接收，请使用新的处方编号');
    prescription = { id: nextId(), prescriptionNoToken: payload.prescriptionNoToken, hospitalName: payload.hospitalName, centerName: payload.centerName, batchNo, orderId: order?.id, stage: 'RECEIVED', itemCount: payload.items.length, deliverStatus: 'PENDING', createdAt: command.occurredAt, items: payload.items } as any;
    demo.prescriptions.unshift(prescription!); payload.prescriptionId = prescription!.id;
  }
  if (prescription && type === 'DECOCTION_PROCESSED') Object.assign(prescription, { stage: 'PACKAGING', items: payload.items, itemCount: payload.items.length });
  if (prescription && type === 'DECOCTION_DELIVERED') Object.assign(prescription, { stage: payload.deliveryStage === 'DELIVERING' ? 'DELIVERING' : 'COMPLETED', deliverStatus: payload.deliveryStage === 'DELIVERING' ? 'DELIVERING' : 'SIGNED' });
  const eventId = nextId();
  const record = { eventId, eventType: type, eventTypeName: eventNames[type] || type, schemaVersion: command.schemaVersion, occurredAt: command.occurredAt || now(), sourceSystem: '静态协同数据', processStatus: 'ACCEPTED' as const, proofStatus: 'PENDING' as const, businessKey: command.sourceBusinessKey, payload, payloadDigest: `STATIC-SNAPSHOT-${eventId}` };
  demo.events.unshift(record);
  const objects=demo.collections['business-objects'];
  let object=objects.find(r=>r.sourceBusinessKey===batchNo);
  if(!object){object={id:nextId(),objectType:'CROP_BATCH',projectSpaceId:'1',sourceBusinessKey:batchNo,status:'ACTIVE',currentVersionNo:0};object.objectId=object.id;objects.unshift(object);}
  object.currentVersionNo++;object.attributes=JSON.stringify(payload);object.currentAttributes=copy(payload);object.updatedAt=now();
  demo.proofs.unshift({proofRecordId:nextId(),subjectType:'EVENT',subjectId:eventId,proofStatus:'PENDING',targets:[{chainType:'CHANGAN_CHAIN',networkCode:'STATIC'}],chainRecords:[]});
  for (const id of payload.evidenceIds || []) {
    const evidence = demo.evidences.find(r => r.evidenceId === id);
    if (evidence) { evidence.eventIds = [...new Set([...(evidence.eventIds || []), eventId])]; }
  }
  activity(record.eventTypeName, `${batchNo} / ${eventId}`);
  return { ...record, id: eventId, status: 'ACCEPTED' };
}
export function resolveCase(id: string, payload: RecordData, note: string) {
  const record = demo.cases.find(r => r.id === id);
  if (!record || !note.trim()) throw new Error('请填写处理说明');
  if (record.status === 'RESOLVED') throw new Error('案卷已关闭');
  if (record.ruleCode === 'VALUE_SET_ITEM_INVALID' && payload.unit !== 'kg') throw new Error('请将单位修正为 kg');
  if (record.ruleCode === 'CS-NHSA-TCM-PIECE' && !/^\d{16}$/.test(payload.insuranceCode || '')) throw new Error('医保编码必须为16位数字');
  const event = submitStaticEvent({ eventType: 'GOVERNANCE_CORRECTED', sourceBusinessKey: `CASE-${id}`, schemaVersion: '1.0.0', occurredAt: now(), payload: { ...payload, batchNo: record.batchNo } });
  Object.assign(record, { status: 'RESOLVED', resolutionNote: note, rawPayloadSnippet: JSON.stringify(payload), history: [...record.history, `${now()} 修正并重放，事件 ${event.eventId}`] });
  activity('治理案卷关闭', record.caseNo); return event;
}
export function runStaticJob(id: string) {
  const job = demo.jobs.find(r => r.jobId === id); if (!job) throw new Error('作业不存在');
  for (const proof of demo.proofs) confirmProof(proof);
  for (const projection of demo.projections) projection.status = 'GENERATED';
  Object.assign(job, { status: 'COMPLETED', lastRunTime: now(), runCount: job.runCount + 1 }); activity('补偿作业完成', job.name);
}
export function confirmProof(proof: RecordData) {
  proof.proofStatus = 'CONFIRMED';
  proof.chainRecords = (proof.targets || [{ chainType: 'CHANGAN_CHAIN', networkCode: 'STATIC' }]).map((target: any) => ({ ...target, chainRecordId: proof.proofRecordId, transactionHash: `STATIC-TX-${proof.proofRecordId}-${target.chainType}`, blockHeight: demo.sequence, status: 'CONFIRMED', reconcileStatus: 'MATCHED', confirmedAt: now(), receiptPayload: '静态模拟回执，不代表真实上链' }));
  const event = demo.events.find(r => r.eventId === proof.subjectId); if (event) event.proofStatus = 'CONFIRMED';
}
export function staticLineage(rootType: string, rootId: string, depth = 3, maxNodes = 100) {
  const rootEvent = demo.events.find(r => r.eventId === rootId);
  const batchNo = rootType === 'EVENT' ? rootEvent?.payload.batchNo : findBatch(rootId);
  if (!batchNo) throw new Error('未找到关联业务');
  const nodes: RecordData[] = [{ id: batchNo, label: batchNo, type: 'BATCH', batchNo }], edges: RecordData[] = [];
  const events = demo.events.filter(r => r.payload.batchNo === batchNo).slice().reverse();
  for (const event of events) { nodes.push({ id: event.eventId, label: event.eventTypeName, type: 'EVENT', batchNo, eventId: event.eventId, status: event.processStatus }); edges.push({ source: batchNo, target: event.eventId, label: '业务事件' }); }
  for(let i=1;i<events.length;i++) edges.push({source:events[i-1].eventId,target:events[i].eventId,label:'后续记录'});
  for(const trace of demo.traceCodes.filter(r=>r.batchNo===batchNo)){nodes.push({id:`trace-${trace.code}`,subjectId:trace.id,label:trace.code,type:'TRACE_CODE',batchNo});edges.push({source:trace.parentCode?`trace-${trace.parentCode}`:batchNo,target:`trace-${trace.code}`,label:'包装关联'});}
  for (const evidence of demo.evidences.filter(r => r.batchNo === batchNo || r.eventIds?.some((id: string) => events.some(e => e.eventId === id)))) { nodes.push({ id: `evidence-${evidence.evidenceId}`, subjectId: evidence.evidenceId, label: evidence.name || evidence.type, type: 'EVIDENCE', batchNo }); edges.push({ source: batchNo, target: `evidence-${evidence.evidenceId}`, label: '证据' }); }
  const levelNodes = depth <= 1 ? nodes.filter(r=>r.type==='BATCH'||r.id===rootId) : nodes;
  const ordered=levelNodes.filter(r=>r.id===rootId).concat(levelNodes.filter(r=>r.id!==rootId));const visible=ordered.slice(0,maxNodes);const visibleIds=new Set(visible.map(r=>r.id));
  return { rootId, sourceVersion: `STATIC-${demo.sequence}`, truncated: visible.length < nodes.length, nodes: visible, edges: edges.filter(r => visibleIds.has(r.source) && visibleIds.has(r.target)) };
}
