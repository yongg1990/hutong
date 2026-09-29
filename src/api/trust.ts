import { request } from './client';

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
  subjectId: string;
  fileId?: string;
  externalUriRef?: string;
  contentDigest?: string;
  issuerPartyId?: string;
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
    projectSpaceId?: string | number;
    purposeCode?: string;
    maxDepth?: number;
    maxNodes?: number;
  }): Promise<any> {
    return request.get(`/exchange-query/lineage/${params.rootType}/${params.rootId}`, {
        params: {
          projectSpaceId: String(params.projectSpaceId || localStorage.getItem('tcmirp_project_space_id') || '1'),
          purposeCode: params.purposeCode || localStorage.getItem('tcmirp_purpose_code') || 'TRACE',
          maxDepth: params.maxDepth || 3,
          maxNodes: params.maxNodes || 100
        }
      });
  },

  // 当前文档仅支持按证据 ID 查询。
  async getEvidenceList(params?: { evidenceId?: string | number }): Promise<EvidenceItem[]> {
    if (params?.evidenceId) {
      return request.get(`/openapi/v1/evidence/${params.evidenceId}`).then((item: any) => [{
          evidenceId: String(item.id),
          type: item.evidenceType,
          subjectType: item.subjectType,
          subjectId: item.subjectId,
          fileId: item.fileId,
          fileHash: item.contentDigest,
          status: item.status
        }]);
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
    const subjectId = String(params.subjectId ?? params.fileId ?? '');
    if (!subjectType || !/^\d+$/.test(subjectId)) {
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
      return this.getProofStatus(params.subjectType, params.subjectId, {
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
        });
    }
    return [];
  },

  async verifyProof(item: ProofMerkleItem): Promise<any> {
    return request.post('/openapi/v1/proofs/verify', {
      subjectType: item.subjectType,
      subjectId: String(item.subjectId),
      chainType: item.chainType || undefined,
      proofMode: 'DIGEST_ONLY'
    });
  },

  async retryProof(proofId: string): Promise<{ success: boolean; newTxHash: string }> {
    const res: any = await request.post(`/openapi/v1/proofs/${encodeURIComponent(proofId)}/retry`);
    return { success: true, newTxHash: String(res?.retryId || '') };
  }
};
