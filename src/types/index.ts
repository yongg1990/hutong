export interface UiApiError {
  httpStatus: number;
  code: string;
  message: string;
  requestId: string;
  traceId: string;
  retryable: boolean;
  retryAfterSeconds?: number;
  fieldErrors: Array<{
    fieldPath: string;
    ruleCode: string;
    errorCode: string;
    message: string;
  }>;
}

export interface UserSession {
  userId: string;
  displayName: string;
  roleName: string;
  permissionCodes: string[];
  dataScope: string;
  tokenExpiry: string;
}

export interface ContextState {
  tenantId: string;
  tenantName: string;
  projectId: string;
  projectName: string;
  appId: string;
  purposeCode: string;
  userName?: string;
  userRole?: string;
  deploymentCapabilities: string[];
}

export interface WorkItem {
  id: string;
  type: string; // "GOVERNANCE_CASE" | "BATCH_INGEST" | "PROOF_SUBMISSION" | "EXCHANGE_PROJECTION"
  typeCode: string;
  title: string;
  subjectId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED';
  occurredAt: string;
  source: string;
  route: string;
  severity?: 'high' | 'medium' | 'low';
}

export interface ActivityLog {
  id: string;
  title: string;
  detail: string;
  time: string;
  type: 'EVENT' | 'PROOF' | 'MAPPING' | 'NODE';
}

export interface FieldCropBatch {
  id: string;
  batchNo: string;
  baseName: string;
  plotName: string;
  herbName: string;
  plantDate: string;
  lastEvent: string;
  status: 'GROWING' | 'CHECKING' | 'ARCHIVED';
  stage: 'PLANTING' | 'AGRICULTURAL' | 'INPUTS' | 'HARVEST_PREP' | 'HARVEST_DONE';
}

export interface PrimaryProcessingBatch {
  id: string;
  primaryBatchNo: string;
  harvestBatchNo: string;
  herbName: string;
  processMethod: string;
  facilityName: string;
  freshWeight: number;
  driedWeight: number;
  yieldRate: string;
  moistureContent: string;
  impurityContent: string;
  operator: string;
  processedAt: string;
  status: 'PROCESSING' | 'COMPLETED' | 'INSPECTED';
}

export interface SupplyOrder {
  id: string;
  orderNo: string;
  pieceName: string;
  batchNo: string;
  quantity: number;
  unit: string;
  warehouse: string;
  stockStatus: 'WAREHOUSED' | 'IN_TRANSIT' | 'PLEDGED' | 'DELIVERED';
  fulfillmentStatus: 'PENDING_OUT' | 'PENDING_DELIVERY' | 'COMPLETED';
  insuranceCode: string;
  pledgeAmount?: number;
  stage: 'CONFIRMED' | 'WAREHOUSED' | 'OUT_BOUND' | 'DELIVERED' | 'PLEDGED';
}

export interface DecoctionOrder {
  id: string;
  prescriptionNoToken: string; // Masked/Tokenized
  hospitalName: string;
  centerName: string;
  stage: 'RECEIVED' | 'DECOCTING' | 'PACKAGING' | 'DELIVERING' | 'COMPLETED';
  itemCount: number;
  deliverStatus: 'PENDING' | 'DELIVERING' | 'SIGNED';
  createdAt: string;
}

export interface GovernanceCase {
  id: string;
  caseNo: string;
  ruleCode: string;
  sourceSystem: string;
  rawPayloadSnippet: string;
  status: 'OPEN' | 'RESOLVED' | 'REPLAYING';
  errorDetail: string;
  createdAt: string;
}

export interface MappingRule {
  id: string;
  sourcePath: string;
  targetPath: string;
  transformRule: string;
  isRequired: boolean;
  validationStatus: 'PASSED' | 'FAILED' | 'WARNING';
  sampleValue?: string;
}

export interface EventSchemaConfig {
  eventType: string;
  eventTypeName: string;
  schemaVersion: string;
  scenarioCode: string;
  status: 'DRAFT' | 'TESTED' | 'PUBLISHED' | 'DEPRECATED';
  groups: Array<{
    code: string;
    title: string;
    fields: string[];
  }>;
  jsonSchema: any;
}

export interface MasterParty {
  id: string;
  partyCode: string;
  partyName: string;
  partyType: 'PRODUCER' | 'PROCESSOR' | 'WAREHOUSE' | 'HOSPITAL' | 'PLATFORM';
  region: string;
  externalCodeCount: number;
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface MasterObject {
  id: string;
  objectType: 'CROP_BATCH' | 'PROCESS_BATCH' | 'HERB_PACKAGE' | 'ORDER';
  objectCode: string;
  displayName: string;
  ownerParty: string;
  version: string;
  status: 'ACTIVE' | 'ARCHIVED';
  lastEventTime: string;
}

export interface HerbPiece {
  id: string;
  speciesName: string;
  processMethod: string;
  spec: string;
  medicalInsuranceCode: string;
  nmpaCode: string;
  batchNo: string;
  packageCount: number;
  traceCodeCount: number;
}

export interface TrustEvent {
  eventId: string;
  eventType: string;
  eventTypeName: string;
  occurredAt: string;
  sourceSystem: string;
  processStatus: 'ACCEPTED' | 'PROCESSING' | 'FAILED';
  proofStatus: 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'RETRYABLE';
  businessKey: string;
  payload: Record<string, any>;
  sensitiveLevel?: 'PUBLIC' | 'RESTRICTED' | 'STRICT_SENSITIVE';
}

export interface ProofRecord {
  id: string;
  subjectName: string;
  chainType: '长安链' | 'FISCO BCOS';
  network: string;
  proofStatus: 'SUBMITTED' | 'CONFIRMED' | 'MANUAL_ACTION' | 'FAILED';
  txHash: string;
  blockHeight: string | number;
  reconcileStatus: 'MATCHED' | 'UNMATCHED' | 'PENDING';
  confirmTime?: string;
}

export interface ExchangeProjection {
  id: string;
  projectionNo: string;
  profileCode: string;
  profileName: string;
  version: string;
  datasetName: string;
  asOfTime: string;
  status: 'GENERATED' | 'REJECTED' | 'DELIVERING' | 'DELIVERED';
  recordCount: number;
  outputHash: string;
  errorCount: number;
  errorDetails?: Array<{ targetPath: string; sourcePath: string; reason: string }>;
}

export interface DeploymentNode {
  id: string;
  nodeCode: string;
  nodeName: string;
  type: 'STANDALONE' | 'EDGE_NODE';
  lastHeartbeat: string;
  status: 'HEALTHY' | 'QUEUE_BACKLOG' | 'CERT_EXPIRING' | 'OFFLINE';
  queueLength: number;
}

export interface AsyncJob {
  jobId: string;
  title: string;
  progressPercent: number;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  nextPollAt: number;
  routeRedirect?: string;
}
