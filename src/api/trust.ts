import { request, apiCall } from './client';

export interface EvidenceItem {
  evidenceId: string;
  name?: string;
  type: string;
  fileHash: string;
  uploadTime?: string;
  fileSize?: string;
  subjectType?: string;
  subjectId?: string | number;
  fileId?: string | number;
  status?: string;
}

export interface EvidenceBindRequest {
  evidenceType: string;
  subjectType: string;
  subjectId: number;
  fileId?: number;
  externalUriRef?: string;
  contentDigest?: string;
  issuerPartyId?: number;
  validFrom?: string;
  validTo?: string;
}

export interface ProofMerkleItem {
  proofNo: string;
  merkleRoot: string;
  eventCount: number;
  blockHeight: string;
  txHash: string;
  status: string;
  proofStatus?: string;
  chainStatus?: string;
  latestTransactionHash?: string;
  subjectType?: string;
  subjectId?: string | number;
  chainRecordId?: string | number;
  chainType?: string;
  networkCode?: string;
  confirmedAt?: string;
  reconcileStatus?: string;
  receiptPayload?: string;
}

/**
 * 可信血缘、证据与存证接口 (Swagger: /api/tcmirp/trust/*)
 */
export const trustApi = {
  // 获取全流程血缘追溯关系图谱 GET /api/tcmirp/trust/lineage
  async getLineageGraph(params: {
    rootType: string;
    rootId: string | number;
    projectSpaceId?: number;
    purposeCode?: string;
    maxDepth?: number;
    maxNodes?: number;
  }): Promise<any> {
    return apiCall(
      request.get(`/exchange-query/lineage/${params.rootType}/${params.rootId}`, {
        params: {
          projectSpaceId: params.projectSpaceId || Number(localStorage.getItem('tcmirp_project_space_id')) || 1,
          purposeCode: params.purposeCode || localStorage.getItem('tcmirp_purpose_code') || 'TRACE',
          maxDepth: params.maxDepth || 3,
          maxNodes: params.maxNodes || 100
        }
      }),
      {
        rootId: Number(params.rootId),
        nodes: [
          { id: 'CB-WS-2026-018', label: '文山三七种植', type: 'FIELD' },
          { id: 'PRIMARY-SQ-20260801', label: '产地趁鲜切制', type: 'PRIMARY' },
          { id: 'SQ-260731-08', label: '饮片精深加工', type: 'PROCESS' },
          { id: 'QJ-240808-01', label: '全项全检合格', type: 'QUALITY' },
          { id: 'IN-20260808-0021', label: '昆明中心仓入库', type: 'WAREHOUSE' },
          { id: 'PRE-8892102', label: '省中医医院处方代煎', type: 'DECOCTION' }
        ],
        edges: [
          { source: 'CB-WS-2026-018', target: 'PRIMARY-SQ-20260801', label: '采收送切' },
          { source: 'PRIMARY-SQ-20260801', target: 'SQ-260731-08', label: '净选炮制' },
          { source: 'SQ-260731-08', target: 'QJ-240808-01', label: '抽样质检' },
          { source: 'SQ-260731-08', target: 'IN-20260808-0021', label: '成品入仓' },
          { source: 'IN-20260808-0021', target: 'PRE-8892102', label: '配送调配' }
        ],
        truncated: false,
        sourceVersion: 'local-baseline'
      },
      '获取追溯图谱数据'
    );
  },

  // 当前文档仅支持按证据 ID 查询。
  async getEvidenceList(params?: { evidenceId?: string | number }): Promise<EvidenceItem[]> {
    if (params?.evidenceId) {
      return apiCall(
        request.get(`/openapi/v1/evidence/${params.evidenceId}`).then((item: any) => [{
          evidenceId: String(item.id),
          type: item.evidenceType,
          subjectType: item.subjectType,
          subjectId: item.subjectId,
          fileId: item.fileId,
          fileHash: item.contentDigest,
          status: item.status
        }])),
        [],
        '按ID查询证据'
      );
    }
    return [];
  },

  async createEvidence(data: EvidenceBindRequest): Promise<EvidenceItem> {
    const item: any = await request.post('/openapi/v1/evidence', data);
    return {
      evidenceId: String(item.id),
      type: item.evidenceType,
      subjectType: item.subjectType,
      subjectId: item.subjectId,
      fileId: item.fileId,
      fileHash: item.contentDigest,
      status: item.status
    };
  },

  async getProofStatus(subjectType: string, subjectId: string | number, params?: { chainType?: string; includeReceipts?: boolean }): Promise<any> {
    return request.get(`/openapi/v1/proofs/${subjectType}/${subjectId}`, { params });
  },

  // POST /openapi/v1/proofs/verify
  async verifyEvidenceHash(
    evidenceId: string,
    params: { fileId?: string | number; subjectType?: string; subjectId?: string | number; digest?: string }
  ): Promise<{ success: boolean; hashMatched: boolean; evidenceId: string }> {
    const subjectType = params.subjectType || (params.fileId ? 'FILE' : undefined);
    const subjectId = Number(params.subjectId ?? params.fileId);
    if (!subjectType || !Number.isFinite(subjectId)) {
      throw new Error('缺少可验真的主体 ID');
    }
    const normalizedDigest = params.digest
      ? (params.digest.startsWith('sha256:') ? params.digest : `sha256:${params.digest}`)
      : undefined;
    return request.post('/openapi/v1/proofs/verify', {
        subjectType,
        subjectId,
        digest: normalizedDigest,
        proofMode: 'DIGEST_ONLY'
      }).then((res: any) => ({ success: true, hashMatched: Boolean(res?.matched), evidenceId }));
  },

  // GET /openapi/v1/proofs/{subjectType}/{subjectId}
  async getMerkleProofs(params?: { subjectType?: string; subjectId?: string | number; chainType?: string; includeReceipts?: boolean }): Promise<ProofMerkleItem[]> {
    if (params?.subjectType && params?.subjectId) {
      return apiCall(
        this.getProofStatus(params.subjectType, params.subjectId, {
          chainType: params.chainType || undefined,
          includeReceipts: params.includeReceipts ?? false
        }).then((res: any) => {
          const records = Array.isArray(res?.chainRecords) ? res.chainRecords : [];
          if (!records.length) {
            return [{
              proofNo: String(res?.proofRecordId || ''), merkleRoot: '', eventCount: 0, blockHeight: '',
              txHash: res?.latestTransactionHash || '', status: res?.proofStatus || 'PENDING',
              proofStatus: res?.proofStatus, latestTransactionHash: res?.latestTransactionHash,
              subjectType: res?.subjectType, subjectId: res?.subjectId
            } as ProofMerkleItem];
          }
          return records.map((item: any) => ({
            proofNo: String(res.proofRecordId), merkleRoot: '', eventCount: 0, blockHeight: String(item.blockHeight || ''),
            txHash: item.transactionHash || '', status: res.proofStatus || item.status, proofStatus: res.proofStatus,
            chainStatus: item.status, latestTransactionHash: res.latestTransactionHash,
            subjectType: res.subjectType, subjectId: res.subjectId,
            chainRecordId: item.chainRecordId, chainType: item.chainType, networkCode: item.networkCode,
            confirmedAt: item.confirmedAt, reconcileStatus: item.reconcileStatus, receiptPayload: item.receiptPayload
          }));
        }),
        [],
        '查询存证状态'
      );
    }
    return [];
  },

  async verifyProof(item: ProofMerkleItem): Promise<any> {
    return request.post('/openapi/v1/proofs/verify', {
      subjectType: item.subjectType,
      subjectId: Number(item.subjectId),
      chainType: item.chainType || undefined,
      proofMode: 'DIGEST_ONLY'
    });
  },

  // 存证失败手工重试 POST /api/tcmirp/trust/proofs/{proofId}/retry
  async retryProof(proofId: string): Promise<{ success: boolean; newTxHash: string }> {
    return apiCall(
      request.post(`/openapi/v1/proofs/${proofId}/retry`).then((res: any) => ({
        success: true,
        newTxHash: String(res?.retryId || '')
      })),
      { success: true, newTxHash: '0x' + Math.random().toString(16).substr(2, 32) },
      '重试存证提交'
    );
  }
};
