import { request, apiCall } from './client';
import { mockHerbPieces } from './mockData';
import type { HerbPiece } from '@/types';

export interface PartyCreateRequest {
  partyType: string;
  partyName: string;
  regionCode?: string;
  attributes?: string;
}

export interface PartyResponse {
  partyId: string;
  status: string;
}

export interface NamespaceDefRequest {
  namespaceCode: string;
  namespaceName: string;
  targetType: 'PARTY' | 'OBJECT';
  valuePattern?: string;
}

export interface NamespaceDefResponse extends NamespaceDefRequest {
  namespaceId: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessObjectRequest {
  projectSpaceId: string;
  objectType: string;
  ownerPartyId?: string;
  attributes: string;
  sourceBusinessKey: string;
}

export interface BusinessObjectResponse {
  objectId: string;
  versionNo: string;
}

export interface IdentifierResolveRequest {
  sourceSystemId: string;
  namespaceCode: string;
  identifierValue: string;
  targetType: string;
}

export interface IdentifierResolutionResponse {
  resolutionStatus: 'RESOLVED' | 'NOT_FOUND' | 'AMBIGUOUS' | 'INACTIVE' | string;
  targetId?: string;
  candidateIds?: string[];
}

export interface IdentifierBindingRequest {
  targetType: string;
  targetId: string;
  sourceSystemId: string;
  namespaceCode: string;
  identifierValue: string;
  validFrom: string;
}

export interface IdentifierBindingResponse {
  bindingId: string;
  status: string;
}

export interface PieceProductCodeItem {
  schemeCode: string;
  code: string;
  validFrom?: string;
  validTo?: string;
  sourceAuthority?: string;
}

export const masterDataApi = {
  registerParty(data: PartyCreateRequest): Promise<PartyResponse> {
    return request.post<PartyResponse, PartyResponse>('/openapi/v1/parties', data);
  },

  registerNamespace(data: NamespaceDefRequest): Promise<NamespaceDefResponse> {
    return request.post<NamespaceDefResponse, NamespaceDefResponse>('/openapi/v1/identifier-namespaces', data);
  },

  registerBusinessObject(data: BusinessObjectRequest): Promise<BusinessObjectResponse> {
    return request.post<BusinessObjectResponse, BusinessObjectResponse>('/openapi/v1/business-objects', data);
  },

  resolveIdentifier(data: IdentifierResolveRequest): Promise<IdentifierResolutionResponse> {
    return request.post<IdentifierResolutionResponse, IdentifierResolutionResponse>('/openapi/v1/identifiers-resolve', data);
  },

  bindIdentifier(data: IdentifierBindingRequest): Promise<IdentifierBindingResponse> {
    return request.post<IdentifierBindingResponse, IdentifierBindingResponse>('/openapi/v1/identifier-bindings', data);
  },

  async getHerbPieces(params?: { keyword?: string }): Promise<HerbPiece[]> {
    return apiCall(
      request.get('/master/decoction-pieces', { params }),
      mockHerbPieces.filter(piece => {
        if (!params?.keyword) return true;
        const keyword = params.keyword.toLowerCase();
        return (piece.speciesName || '').toLowerCase().includes(keyword)
          || (piece.batchNo || '').toLowerCase().includes(keyword)
          || (piece.medicalInsuranceCode || '').includes(keyword);
      }),
      '获取饮片与监管编码列表'
    );
  },

  async createHerbPiece(payload: Partial<HerbPiece> & { executiveStandard?: string }): Promise<HerbPiece> {
    const newPiece: HerbPiece = {
      id: `PIECE-${Date.now().toString().slice(-4)}`,
      speciesName: payload.speciesName || '三七',
      processMethod: payload.processMethod || '切片',
      spec: payload.spec || '500g/袋',
      medicalInsuranceCode: payload.medicalInsuranceCode || '8691234567890199',
      nmpaCode: payload.nmpaCode || 'Y20265300099',
      batchNo: payload.batchNo || 'SQ-260808-99',
      packageCount: payload.packageCount || 100,
      traceCodeCount: payload.traceCodeCount || 100
    };

    const codes: PieceProductCodeItem[] = [];
    if (newPiece.medicalInsuranceCode) {
      codes.push({
        schemeCode: 'NATIONAL_MEDICAL_INSURANCE_16',
        code: newPiece.medicalInsuranceCode,
        validFrom: new Date().toISOString().slice(0, 10),
        sourceAuthority: '国家医疗保障局'
      });
    }
    if (newPiece.nmpaCode) {
      codes.push({
        schemeCode: 'NMPA_DRUG_TRACE',
        code: newPiece.nmpaCode,
        validFrom: new Date().toISOString().slice(0, 10),
        sourceAuthority: '国家药品监督管理局'
      });
    }

    return apiCall(
      request.post('/openapi/v1/decoction-piece-products', {
        productName: `${newPiece.speciesName} (${newPiece.processMethod})`,
        materialName: newPiece.speciesName,
        processingMethod: newPiece.processMethod,
        specification: newPiece.spec,
        executiveStandard: payload.executiveStandard || '《中国药典》2025年版一部',
        codes
      }).then((response: any) => ({
        ...newPiece,
        id: String(response?.productId || newPiece.id)
      })),
      newPiece,
      '保存饮片编码主数据'
    );
  }
};
