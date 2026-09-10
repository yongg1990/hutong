import type {
  WorkItem,
  ActivityLog,
  FieldCropBatch,
  PrimaryProcessingBatch,
  SupplyOrder,
  DecoctionOrder,
  GovernanceCase,
  MappingRule,
  MasterParty,
  MasterObject,
  HerbPiece,
  TrustEvent,
  ProofRecord,
  ExchangeProjection,
  DeploymentNode
} from '@/types';

// UIQ-010: 工作台事项
export const mockWorkItems: WorkItem[] = [
  {
    id: 'CASE-20260808-01',
    type: 'GOVERNANCE_CASE',
    typeCode: '代码映射错误',
    title: '医保饮片编码未匹配 (8691234567890123)',
    subjectId: 'YN-20260808-32',
    status: 'PENDING',
    occurredAt: '10分钟前',
    source: '供销批次 YN-20260808-32',
    route: '/governance/cases',
    severity: 'high'
  },
  {
    id: 'BATCH-20260808-04',
    type: 'BATCH_INGEST',
    typeCode: '批量接入异常',
    title: 'WMS入仓批次部分记录处理失败',
    subjectId: 'BATCH-KM-04',
    status: 'PROCESSING',
    occurredAt: '35分钟前',
    source: 'WMS-KM-01 (成功 2,418 / 失败 16)',
    route: '/governance/batches',
    severity: 'medium'
  },
  {
    id: 'PROOF-20260808-02',
    type: 'PROOF_SUBMISSION',
    typeCode: '链存证待确认',
    title: '长安链提交 3 条 submissionKey 状态待人工处理',
    subjectId: 'SUB-CA-003',
    status: 'PENDING',
    occurredAt: '1小时前',
    source: '上海节点',
    route: '/trust/proofs',
    severity: 'high'
  },
  {
    id: 'PRJ-20260808-68',
    type: 'EXCHANGE_PROJECTION',
    typeCode: '互通投影完成',
    title: '上海中药饮片互认追溯数据集生成完成',
    subjectId: 'PRJ-20260808-0068',
    status: 'COMPLETED',
    occurredAt: '2小时前',
    source: '上海契约 V1.2.0 (输出 366 条)',
    route: '/exchange/projections',
    severity: 'low'
  }
];

export const mockActivityLogs: ActivityLog[] = [
  { id: 'ACT-01', title: '供销交割事件已接受', detail: '订单 XS-202608-018 · 入仓事件已关联', time: '16:18', type: 'EVENT' },
  { id: 'ACT-02', title: '质检报告完成区块链存证', detail: '批次 QJ-240808-01 · 长安链交易号 0x71c2...a908', time: '15:52', type: 'PROOF' },
  { id: 'ACT-03', title: 'WMS 映射配置 1.4.0 已发布', detail: '已应用于 4 个机构前置节点', time: '14:30', type: 'MAPPING' },
  { id: 'ACT-04', title: '前置节点 EDGE-KM-02 恢复正常', detail: '心跳间隔 2.4s · 队列积压已释放', time: '13:46', type: 'NODE' }
];

// FE-101 田间种植数据
export const mockFieldBatches: FieldCropBatch[] = [
  { id: 'CB-01', batchNo: 'CB-WS-2026-018', baseName: '文山三七示范基地', plotName: 'A-16号地块', herbName: '三七', plantDate: '2026-03-12', lastEvent: '农事作业 (中耕除草与土壤松土)', status: 'GROWING', stage: 'AGRICULTURAL' },
  { id: 'CB-02', batchNo: 'CB-WS-2026-021', baseName: '文山三七示范基地', plotName: 'B-08号地块', herbName: '三七', plantDate: '2026-03-18', lastEvent: '农事作业 (人工遮阴棚维护)', status: 'GROWING', stage: 'AGRICULTURAL' },
  { id: 'CB-03', batchNo: 'CB-DL-2026-006', baseName: '大理当归种植基地', plotName: 'C-03号地块', herbName: '当归', plantDate: '2026-02-27', lastEvent: '投入品施用 (生物有机肥 150kg)', status: 'CHECKING', stage: 'INPUTS' },
  { id: 'CB-04', batchNo: 'CB-LJ-2026-011', baseName: '丽江木香云药基地', plotName: 'A-02号地块', herbName: '木香', plantDate: '2026-03-03', lastEvent: '种植建档完成与地块码绑定', status: 'GROWING', stage: 'PLANTING' },
  { id: 'CB-05', batchNo: 'CB-WS-2026-030', baseName: '文山三七示范基地', plotName: 'A-05号地块', herbName: '三七', plantDate: '2026-01-15', lastEvent: '采收准备 (农残与重金属快速检测合格)', status: 'CHECKING', stage: 'HARVEST_PREP' },
  { id: 'CB-06', batchNo: 'CB-CX-2026-002', baseName: '楚雄滇重楼基地', plotName: 'D-01号地块', herbName: '滇重楼', plantDate: '2025-11-10', lastEvent: '采收完成 (完成采收 1,500kg 鲜重)', status: 'ARCHIVED', stage: 'HARVEST_DONE' },
  { id: 'CB-07', batchNo: 'CB-ZT-2026-005', baseName: '昭通乌蒙天麻基地', plotName: 'E-12号地块', herbName: '天麻', plantDate: '2026-04-01', lastEvent: '种植建档完成 (萌发菌与蜜环菌接种)', status: 'GROWING', stage: 'PLANTING' },
  { id: 'CB-08', batchNo: 'CB-WS-2026-025', baseName: '文山三七示范基地', plotName: 'C-01号地块', herbName: '三七', plantDate: '2026-02-10', lastEvent: '投入品施用 (低毒生物农药喷洒记录)', status: 'CHECKING', stage: 'INPUTS' },
  { id: 'CB-09', batchNo: 'CB-DL-2026-012', baseName: '大理当归种植基地', plotName: 'B-04号地块', herbName: '当归', plantDate: '2026-01-20', lastEvent: '采收准备 (采收批次预编号 HARVEST-DL-02)', status: 'CHECKING', stage: 'HARVEST_PREP' },
  { id: 'CB-10', batchNo: 'CB-WS-2026-015', baseName: '文山三七示范基地', plotName: 'A-01号地块', herbName: '三七', plantDate: '2025-12-01', lastEvent: '采收完成 (完成采收 2,800kg 鲜三七)', status: 'ARCHIVED', stage: 'HARVEST_DONE' }
];

// 初加工与产地趁鲜切制数据
export const mockPrimaryProcessingBatches: PrimaryProcessingBatch[] = [
  {
    id: 'PRI-01',
    primaryBatchNo: 'PRIMARY-SQ-20260801',
    harvestBatchNo: 'HARVEST-0801',
    herbName: '三七',
    processMethod: '产地趁鲜切制 + 低温热泵干燥',
    facilityName: '文山三七产地初加工车间 (高标GSP中心)',
    freshWeight: 1200,
    driedWeight: 390,
    yieldRate: '32.50%',
    moistureContent: '11.2% (符合ChP<14.0%)',
    impurityContent: '0.15% (符合ChP<1.0%)',
    operator: '张建国 (初加工主管)',
    processedAt: '2026-08-05 16:30',
    status: 'INSPECTED'
  },
  {
    id: 'PRI-02',
    primaryBatchNo: 'PRIMARY-DG-20260728',
    harvestBatchNo: 'HARVEST-DL-02',
    herbName: '当归',
    processMethod: '清洗除杂 + 产地趁鲜薄片切制 + 阴干',
    facilityName: '大理当归产地初加工示范基地',
    freshWeight: 860,
    driedWeight: 285,
    yieldRate: '33.14%',
    moistureContent: '12.0% (符合ChP<13.0%)',
    impurityContent: '0.20% (符合ChP<1.0%)',
    operator: '李文华 (初加工技术员)',
    processedAt: '2026-08-02 11:20',
    status: 'COMPLETED'
  },
  {
    id: 'PRI-03',
    primaryBatchNo: 'PRIMARY-HQ-20260720',
    harvestBatchNo: 'HARVEST-HQ-01',
    herbName: '黄芪',
    processMethod: '机械净洗 + 趁鲜斜切片 + 滚筒干燥',
    facilityName: '昆明中药饮片产地初加工协同仓',
    freshWeight: 2000,
    driedWeight: 640,
    yieldRate: '32.00%',
    moistureContent: '10.8% (符合ChP<12.0%)',
    impurityContent: '0.10% (符合ChP<1.0%)',
    operator: '王成 (生产班长)',
    processedAt: '2026-07-25 14:15',
    status: 'INSPECTED'
  },
  {
    id: 'PRI-04',
    primaryBatchNo: 'PRIMARY-TM-20260802',
    harvestBatchNo: 'HARVEST-ZT-05',
    herbName: '天麻',
    processMethod: '蒸制保鲜 + 趁鲜切厚片 + 低温烘干',
    facilityName: '昭通天麻产地蒸制初加工车间',
    freshWeight: 500,
    driedWeight: 145,
    yieldRate: '29.00%',
    moistureContent: '11.8% (符合ChP<13.0%)',
    impurityContent: '0.05% (符合ChP<0.5%)',
    operator: '陈敏 (质量管理员)',
    processedAt: '2026-08-06 09:40',
    status: 'PROCESSING'
  }
];

// FE-104 供销交割数据
export const mockSupplyOrders: SupplyOrder[] = [
  { id: 'ORD-01', orderNo: 'XS-202608-018', pieceName: '三七饮片 (趁鲜切片)', batchNo: 'SQ-260731-08', quantity: 1200, unit: 'kg', warehouse: '昆明中心仓 (WH-KM-001)', stockStatus: 'WAREHOUSED', fulfillmentStatus: 'PENDING_OUT', insuranceCode: '8691234567890123', stage: 'WAREHOUSED' },
  { id: 'ORD-02', orderNo: 'XS-202608-014', pieceName: '当归饮片 (酒当归)', batchNo: 'DG-260728-03', quantity: 860, unit: 'kg', warehouse: '昆明中心仓 (WH-KM-001)', stockStatus: 'IN_TRANSIT', fulfillmentStatus: 'PENDING_DELIVERY', insuranceCode: '8691234567890124', stage: 'OUT_BOUND' },
  { id: 'ORD-03', orderNo: 'XS-202608-009', pieceName: '黄芪饮片 (蜜黄芪)', batchNo: 'HQ-260720-11', quantity: 2000, unit: 'kg', warehouse: '玉溪协同仓 (WH-YX-002)', stockStatus: 'PLEDGED', fulfillmentStatus: 'COMPLETED', insuranceCode: '8691234567890125', pledgeAmount: 180000, stage: 'PLEDGED' },
  { id: 'ORD-04', orderNo: 'XS-202608-006', pieceName: '木香饮片', batchNo: 'MX-260715-02', quantity: 540, unit: 'kg', warehouse: '昆明中心仓 (WH-KM-001)', stockStatus: 'DELIVERED', fulfillmentStatus: 'COMPLETED', insuranceCode: '8691234567890126', stage: 'DELIVERED' },
  { id: 'ORD-05', orderNo: 'XS-202608-022', pieceName: '天麻饮片 (蒸天麻)', batchNo: 'TM-260802-01', quantity: 300, unit: 'kg', warehouse: '昆明中心仓 (WH-KM-001)', stockStatus: 'WAREHOUSED', fulfillmentStatus: 'PENDING_OUT', insuranceCode: '8691234567890127', stage: 'CONFIRMED' },
  { id: 'ORD-06', orderNo: 'XS-202608-025', pieceName: '三七头切片', batchNo: 'SQ-260805-02', quantity: 1500, unit: 'kg', warehouse: '文山协同仓 (WH-WS-003)', stockStatus: 'WAREHOUSED', fulfillmentStatus: 'PENDING_OUT', insuranceCode: '8691234567890128', stage: 'CONFIRMED' },
  { id: 'ORD-07', orderNo: 'XS-202608-011', pieceName: '滇重楼饮片', batchNo: 'CL-260710-01', quantity: 420, unit: 'kg', warehouse: '楚雄仓 (WH-CX-001)', stockStatus: 'DELIVERED', fulfillmentStatus: 'COMPLETED', insuranceCode: '8691234567890129', stage: 'DELIVERED' },
  { id: 'ORD-08', orderNo: 'XS-202608-003', pieceName: '云南三七精粉', batchNo: 'SQ-260701-05', quantity: 800, unit: 'kg', warehouse: '昆明中心仓 (WH-KM-001)', stockStatus: 'PLEDGED', fulfillmentStatus: 'COMPLETED', insuranceCode: '8691234567890130', pledgeAmount: 240000, stage: 'PLEDGED' }
];

// FE-105 处方代煎数据
export const mockDecoctionOrders: DecoctionOrder[] = [
  { id: 'DEC-01', prescriptionNoToken: 'PRE-8892****102', hospitalName: '云南省中医医院', centerName: '昆明智慧代煎中心', stage: 'DECOCTING', itemCount: 12, deliverStatus: 'PENDING', createdAt: '2026-08-08 14:20' },
  { id: 'DEC-02', prescriptionNoToken: 'PRE-8892****105', hospitalName: '昆明市第一人民医院', centerName: '昆明智慧代煎中心', stage: 'PACKAGING', itemCount: 8, deliverStatus: 'PENDING', createdAt: '2026-08-08 15:10' },
  { id: 'DEC-03', prescriptionNoToken: 'PRE-8892****098', hospitalName: '大理州中医医院', centerName: '滇西代煎中心', stage: 'DELIVERING', itemCount: 15, deliverStatus: 'DELIVERING', createdAt: '2026-08-08 11:30' }
];

// FE-204 治理异常数据
export const mockGovernanceCases: GovernanceCase[] = [
  { id: 'CASE-01', caseNo: 'GC-20260808-001', ruleCode: 'VALUE_SET_ITEM_INVALID', sourceSystem: 'WMS-KM-01', rawPayloadSnippet: '{"unit": "公斤", "code": "8691234567890123"}', status: 'OPEN', errorDetail: '单位 "公斤" 在值域表未匹配标准代码 kg，需规则映射补全', createdAt: '2026-08-08 16:02' },
  { id: 'CASE-02', caseNo: 'GC-20260808-002', ruleCode: 'CS-NHSA-TCM-PIECE', sourceSystem: 'HIS-YN-03', rawPayloadSnippet: '{"insuranceCode": "8691234567890"}', status: 'OPEN', errorDetail: '医保饮片编码长度为 13 位，不满足 16 位国家医保编码规范', createdAt: '2026-08-08 15:45' },
  { id: 'CASE-03', caseNo: 'GC-20260808-003', ruleCode: 'IDENTIFIER_AMBIGUOUS', sourceSystem: 'ERP-WS-02', rawPayloadSnippet: '{"partyName": "云南文山三七加工厂"}', status: 'RESOLVED', errorDetail: '匹配到 2 家重名主体机构，经消解确认选定 ID: PARTY-WS-01', createdAt: '2026-08-08 12:10' }
];

// FE-203 映射规则数据
export const mockMappingRules: MappingRule[] = [
  { id: 'R-01', sourcePath: '$.warehouse_code', targetPath: '$.payload.warehouseCode', transformRule: '标识解析映射', isRequired: true, validationStatus: 'PASSED', sampleValue: 'WH-KM-001' },
  { id: 'R-02', sourcePath: '$.inbound_no', targetPath: '$.payload.inboundNo', transformRule: 'trim', isRequired: true, validationStatus: 'PASSED', sampleValue: 'IN-20260808-0021' },
  { id: 'R-03', sourcePath: '$.batch_no', targetPath: '$.payload.batchNo', transformRule: 'trim', isRequired: true, validationStatus: 'PASSED', sampleValue: 'SQ-260731-08' },
  { id: 'R-04', sourcePath: '$.qty', targetPath: '$.payload.quantity', transformRule: 'decimal(20,6)', isRequired: true, validationStatus: 'PASSED', sampleValue: '1200.000' },
  { id: 'R-05', sourcePath: '$.unit', targetPath: '$.payload.unitCode', transformRule: '值域映射 (公斤 -> kg)', isRequired: true, validationStatus: 'PASSED', sampleValue: 'kg' },
  { id: 'R-06', sourcePath: '$.insurance_code', targetPath: '$.payload.medicalInsurancePieceCode', transformRule: '医保16位格式校验', isRequired: false, validationStatus: 'FAILED', sampleValue: '8691234567890123' },
  { id: 'R-07', sourcePath: '$.temperature', targetPath: '$.payload.storageTemperature', transformRule: 'decimal', isRequired: false, validationStatus: 'PASSED', sampleValue: '20.5' }
];

// FE-301 主体机构
export const mockMasterParties: MasterParty[] = [
  { id: 'PARTY-01', partyCode: 'PT-YN-001', partyName: '云南示范中药材种植合作社', partyType: 'PRODUCER', region: '云南省文山州', externalCodeCount: 3, status: 'ACTIVE' },
  { id: 'PARTY-02', partyCode: 'PT-YN-002', partyName: '昆明中药饮片精深加工有限公司', partyType: 'PROCESSOR', region: '云南省昆明市', externalCodeCount: 5, status: 'ACTIVE' },
  { id: 'PARTY-03', partyCode: 'PT-YN-003', partyName: '云南省医药中心仓储库', partyType: 'WAREHOUSE', region: '云南省昆明市', externalCodeCount: 2, status: 'ACTIVE' },
  { id: 'PARTY-04', partyCode: 'PT-YN-004', partyName: '云南省中医医院', partyType: 'HOSPITAL', region: '云南省昆明市', externalCodeCount: 4, status: 'ACTIVE' }
];

// FE-302 业务对象
export const mockMasterObjects: MasterObject[] = [
  { id: 'OBJ-01', objectType: 'CROP_BATCH', objectCode: 'CB-WS-2026-018', displayName: '文山三七 20260312 种植批次', ownerParty: '云南示范中药材种植合作社', version: 'V1.3', status: 'ACTIVE', lastEventTime: '2026-08-05 14:20' },
  { id: 'OBJ-02', objectType: 'PROCESS_BATCH', objectCode: 'SQ-260731-08', displayName: '三七饮片 (蒸三七头) 加工批次', ownerParty: '昆明中药饮片精深加工有限公司', version: 'V2.0', status: 'ACTIVE', lastEventTime: '2026-08-08 15:42' },
  { id: 'OBJ-03', objectType: 'HERB_PACKAGE', objectCode: '693000260731080001', displayName: '三七饮片 1kg 包装单元', ownerParty: '云南省医药中心仓储库', version: 'V1.0', status: 'ACTIVE', lastEventTime: '2026-08-08 15:42' }
];

// FE-303 饮片编码
export const mockHerbPieces: HerbPiece[] = [
  { id: 'PIECE-01', speciesName: '三七', processMethod: '蒸制 (切厚片)', spec: '1kg/袋', medicalInsuranceCode: '8691234567890123', nmpaCode: 'Y20265300012', batchNo: 'SQ-260731-08', packageCount: 1200, traceCodeCount: 1200 },
  { id: 'PIECE-02', speciesName: '当归', processMethod: '酒酒当归片', spec: '500g/袋', medicalInsuranceCode: '8691234567890124', nmpaCode: 'Y20265300015', batchNo: 'DG-260728-03', packageCount: 1720, traceCodeCount: 1720 },
  { id: 'PIECE-03', speciesName: '黄芪', processMethod: '蜜黄芪', spec: '1kg/袋', medicalInsuranceCode: '8691234567890125', nmpaCode: 'Y20265300019', batchNo: 'HQ-260720-11', packageCount: 2000, traceCodeCount: 2000 }
];

// FE-401 & FE-402 事件列表
export const mockTrustEvents: TrustEvent[] = [
  {
    eventId: '01J7EVENT0KM2026080800021',
    eventType: 'WAREHOUSED',
    eventTypeName: '入仓完成事件',
    occurredAt: '2026-08-08 15:42:16',
    sourceSystem: 'WMS-KM-01',
    processStatus: 'ACCEPTED',
    proofStatus: 'CONFIRMED',
    businessKey: 'IN-20260808-0021',
    sensitiveLevel: 'PUBLIC',
    payload: {
      warehouseCode: 'WH-KM-001',
      warehouseName: '昆明中心仓',
      inboundNo: 'IN-20260808-0021',
      batchNo: 'SQ-260731-08',
      herbName: '三七饮片',
      quantity: 1200.0,
      unitCode: 'kg',
      medicalInsurancePieceCode: '8691234567890123',
      qualityConclusion: 'QUALIFIED',
      storageTemperature: 20.5,
      tempSensorLocation: 'A区温湿度计-03'
    }
  },
  {
    eventId: '01J7EVENT0KM2026080800019',
    eventType: 'QUALITY_INSPECTED',
    eventTypeName: '质量检验事件',
    occurredAt: '2026-08-08 14:10:05',
    sourceSystem: 'LIMS-KM-02',
    processStatus: 'ACCEPTED',
    proofStatus: 'CONFIRMED',
    businessKey: 'QJ-240808-01',
    sensitiveLevel: 'PUBLIC',
    payload: {
      reportNo: 'QJ-240808-01',
      batchNo: 'SQ-260731-08',
      inspectType: 'FULL_STANDARD',
      conclusion: 'QUALIFIED',
      indicators: [
        { name: '浸出物', result: '32.4%', limit: '≥28.0%', status: 'PASS' },
        { name: '人参皂苷Rg1+Rb1', result: '6.8%', limit: '≥5.0%', status: 'PASS' },
        { name: '重金属(铅)', result: '0.2 mg/kg', limit: '≤5.0 mg/kg', status: 'PASS' }
      ]
    }
  },
  {
    eventId: '01J7EVENT0KM2026080800012',
    eventType: 'PRESCRIPTION_RECEIVED',
    eventTypeName: '处方接收事件',
    occurredAt: '2026-08-08 11:30:00',
    sourceSystem: 'HIS-YN-01',
    processStatus: 'ACCEPTED',
    proofStatus: 'CONFIRMED',
    businessKey: 'PRE-8892102',
    sensitiveLevel: 'STRICT_SENSITIVE',
    payload: {
      hospitalCode: 'HOSP-YN-01',
      hospitalName: '云南省中医医院',
      prescriptionNoToken: 'PRE-8892****102',
      patientToken: 'PAT-ENC-77a89f...21',
      doctorName: '李主任医师',
      items: [
        { pieceName: '三七饮片', spec: '蒸制', qty: '15g', usage: '冲服' },
        { pieceName: '当归片', spec: '酒制', qty: '10g', usage: '煎服' }
      ]
    }
  }
];

// FE-405 存证记录 (双链)
export const mockProofRecords: ProofRecord[] = [
  {
    id: 'PRF-01',
    subjectName: '入仓事件 · SQ-260731-08 (IN-20260808-0021)',
    chainType: '长安链',
    network: '上海中药枢纽链',
    proofStatus: 'CONFIRMED',
    txHash: '0x8af37b21e902a114f291029c88219034',
    blockHeight: 12987421,
    reconcileStatus: 'MATCHED',
    confirmTime: '2026-08-08 15:42:22'
  },
  {
    id: 'PRF-02',
    subjectName: '入仓事件 · SQ-260731-08 (IN-20260808-0021)',
    chainType: 'FISCO BCOS',
    network: '滇桂粤联合监管链',
    proofStatus: 'CONFIRMED',
    txHash: '0x71c2a908123847aef9210823901428fa',
    blockHeight: 891204,
    reconcileStatus: 'MATCHED',
    confirmTime: '2026-08-08 15:42:25'
  },
  {
    id: 'PRF-03',
    subjectName: '质检报告 · QJ-240808-01',
    chainType: '长安链',
    network: '上海中药枢纽链',
    proofStatus: 'CONFIRMED',
    txHash: '0x9923847291a823f00123984120938471',
    blockHeight: 12987110,
    reconcileStatus: 'MATCHED',
    confirmTime: '2026-08-08 14:10:15'
  },
  {
    id: 'PRF-04',
    subjectName: '赋码与包装绑定 · SQ-260731-08',
    chainType: 'FISCO BCOS',
    network: '滇桂粤联合监管链',
    proofStatus: 'MANUAL_ACTION',
    txHash: '0x00000000000000000000000000000000',
    blockHeight: '待重试',
    reconcileStatus: 'UNMATCHED',
    confirmTime: '—'
  }
];

// FE-502 互通投影
export const mockProjections: ExchangeProjection[] = [
  {
    id: 'PRJ-01',
    projectionNo: 'PRJ-20260808-0068',
    profileCode: 'SH-PIECE-TRACE',
    profileName: '上海中药饮片互认追溯规范包',
    version: '1.2.0',
    datasetName: 'PIECE_TRACE_DATASET',
    asOfTime: '2026-08-08 16:00:00',
    status: 'GENERATED',
    recordCount: 366,
    outputHash: 'sha256:81adf92014e3a2b91834928127492103',
    errorCount: 0
  },
  {
    id: 'PRJ-02',
    projectionNo: 'PRJ-20260808-0067',
    profileCode: 'NHSA-PIECE-CODE',
    profileName: '国家医保饮片编码对账数据集',
    version: '1.0.0',
    datasetName: 'NHSA_PIECE_DATASET',
    asOfTime: '2026-08-08 15:30:00',
    status: 'REJECTED',
    recordCount: 140,
    outputHash: 'sha256:00000000000000000000000000000000',
    errorCount: 3,
    errorDetails: [
      { targetPath: '$.items[12].medicalInsuranceCode', sourcePath: '$.insurance_code', reason: '必选医保编码字段源值为 null，缺失策略为 REJECT' },
      { targetPath: '$.items[45].traceCode', sourcePath: '$.trace_code', reason: '追溯码格式不合规' }
    ]
  }
];

// FE-602 部署节点
export const mockDeploymentNodes: DeploymentNode[] = [
  { id: 'NODE-01', nodeCode: 'TCMIRP-YUNNAN-PROD', nodeName: '云南省省级核心节点', type: 'STANDALONE', lastHeartbeat: '16:20:14', status: 'HEALTHY', queueLength: 0 },
  { id: 'NODE-02', nodeCode: 'EDGE-KM-01', nodeName: '昆明市医药中心前置节点', type: 'EDGE_NODE', lastHeartbeat: '16:19:52', status: 'HEALTHY', queueLength: 2 },
  { id: 'NODE-03', nodeCode: 'EDGE-KM-02', nodeName: '昆明滇池物流园前置节点', type: 'EDGE_NODE', lastHeartbeat: '16:18:06', status: 'QUEUE_BACKLOG', queueLength: 184 },
  { id: 'NODE-04', nodeCode: 'EDGE-WS-01', nodeName: '文山三七产业园前置节点', type: 'EDGE_NODE', lastHeartbeat: '15:42:11', status: 'CERT_EXPIRING', queueLength: 12 }
];
