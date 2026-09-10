import { request, apiCall } from './client';
import { mockProofRecords } from './mockData';
import type { ProofRecord } from '@/types';

export interface EvidenceItem {
  evidenceId: string;
  name: string;
  type: string;
  fileHash: string;
  uploadTime: string;
  fileSize?: string;
}

const mockEvidences: EvidenceItem[] = [
  { evidenceId: 'EVD-202608-01', name: '云南中药质检检验报告-SQ260731.pdf', type: 'INSPECTION_REPORT', fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', uploadTime: '2026-08-08 14:12', fileSize: '1.8 MB' },
  { evidenceId: 'EVD-202608-02', name: '昆明中心仓入库签收单.pdf', type: 'INBOUND_SLIP', fileHash: '8f4e3c2b1a9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f', uploadTime: '2026-08-08 15:40', fileSize: '640 KB' },
  { evidenceId: 'EVD-202608-03', name: '三七供销购销合同-202608.pdf', type: 'CONTRACT', fileHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', uploadTime: '2026-08-08 10:20', fileSize: '2.4 MB' }
];

export interface ProofMerkleItem {
  proofNo: string;
  merkleRoot: string;
  eventCount: number;
  blockHeight: string;
  txHash: string;
  status: 'ACCEPTED' | 'PENDING' | 'REJECTED';
}

const mockMerkleProofs: ProofMerkleItem[] = [
  { proofNo: 'PF-202608-0912', merkleRoot: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b', eventCount: 128, blockHeight: '#18,294,021', txHash: '0x7f8a...3b21', status: 'ACCEPTED' },
  { proofNo: 'PF-202608-0911', merkleRoot: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b', eventCount: 256, blockHeight: '#18,293,890', txHash: '0x4e2d...9a12', status: 'ACCEPTED' }
];

/**
 * 可信血缘、证据与存证接口 (Swagger: /api/tcmirp/trust/*)
 */
export const trustApi = {
  // 获取全流程血缘追溯关系图谱 GET /api/tcmirp/trust/lineage
  async getLineageGraph(params: { traceCode?: string; depth?: number }): Promise<any> {
    return apiCall(
      request.get('/trust/lineage', { params }),
      {
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
        ]
      },
      '获取追溯图谱数据'
    );
  },

  // 获取电子证据文件列表 GET /api/tcmirp/trust/evidence
  async getEvidenceList(params?: { keyword?: string; evidenceType?: string }): Promise<EvidenceItem[]> {
    return apiCall(
      request.get('/trust/evidence', { params }),
      mockEvidences.filter(e => {
        if (params?.evidenceType && e.type !== params.evidenceType) return false;
        if (params?.keyword) {
          const kw = params.keyword.toLowerCase();
          return (e.name || '').toLowerCase().includes(kw) ||
            (e.fileHash || '').includes(kw) ||
            (e.evidenceId || '').includes(kw);
        }
        return true;
      }),
      '获取电子证据列表'
    );
  },

  // 校验电子证据 SHA-256 哈希有效性 POST /api/tcmirp/trust/evidence/{evidenceId}/verify
  async verifyEvidenceHash(evidenceId: string): Promise<{ success: boolean; hashMatched: boolean; evidenceId: string }> {
    return apiCall(
      request.post(`/trust/evidence/${evidenceId}/verify`),
      { success: true, hashMatched: true, evidenceId },
      '校验电子证据哈希'
    );
  },

  // 获取存证记录列表 GET /api/tcmirp/trust/proofs
  async getProofRecords(params?: { chainType?: string; proofStatus?: string }): Promise<ProofRecord[]> {
    return apiCall(
      request.get('/trust/proofs', { params }),
      mockProofRecords.filter(p => {
        if (params?.chainType && p.chainType !== params.chainType) return false;
        if (params?.proofStatus && p.proofStatus !== params.proofStatus) return false;
        return true;
      }),
      '获取存证记录列表'
    );
  },

  // 获取存证单与 Merkle 根证明 GET /api/tcmirp/trust/merkle-proofs
  async getMerkleProofs(): Promise<ProofMerkleItem[]> {
    return apiCall(
      request.get('/trust/merkle-proofs'),
      mockMerkleProofs,
      '获取Merkle存证根证明'
    );
  },

  // 存证失败手工重试 POST /api/tcmirp/trust/proofs/{proofId}/retry
  async retryProof(proofId: string): Promise<{ success: boolean; newTxHash: string }> {
    return apiCall(
      request.post(`/trust/proofs/${proofId}/retry`),
      { success: true, newTxHash: '0x' + Math.random().toString(16).substr(2, 32) },
      '重试存证提交'
    );
  }
};
