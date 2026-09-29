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

export interface PartyManagement extends PartyCreateRequest, PartyResponse {
  tenantId?: string;
  lockVersion: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IdentifierBindingManagement extends IdentifierBindingRequest, IdentifierBindingResponse {
  identifierDisplay?: string;
  validTo?: string;
  createdAt?: string;
  updatedAt?: string;
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
  lockVersion?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface NamespaceUpdateRequest {
  namespaceName: string;
  valuePattern?: string;
  status: 'ACTIVE' | 'INACTIVE';
  lockVersion: number;
}

export interface NamespacePage {
  records: NamespaceDefResponse[];
  total: number;
  page: number;
  size: number;
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

export interface BusinessObjectSummaryResponse {
  objectId: string;
  tenantId?: string;
  projectSpaceId: string;
  objectType: string;
  currentVersionNo: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  ownerPartyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessObjectDetailResponse extends BusinessObjectSummaryResponse {
  attributes: string;
  effectiveFrom?: string;
}

export interface BusinessObjectUpdateRequest {
  ownerPartyId?: string;
  attributes: string;
  status: 'ACTIVE' | 'INACTIVE';
  currentVersionNo: string;
}

export interface BusinessObjectPage {
  records: BusinessObjectSummaryResponse[];
  total: number;
  page: number;
  size: number;
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
  validFrom: string;
  validTo?: string;
  sourceAuthority: string;
}

export interface PieceProductResponse {
  productId: string;
}

export interface PieceProductDetailResponse {
  productId: string;
  tenantId?: string;
  productName: string;
  materialName: string;
  processingMethod: string;
  specification?: string;
  executiveStandard?: string;
  medicalInsuranceCode?: string;
  nmpaPieceCode?: string;
  regulatoryAttributes?: string;
  nmpaCodeVersion?: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  validFrom?: string;
  validTo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PieceProductPage {
  records: PieceProductDetailResponse[];
  total: number;
  page: number;
  size: number;
}

export interface PieceProductRequest {
  productName: string;
  materialName: string;
  processingMethod: string;
  specification?: string;
  executiveStandard?: string;
  codes: PieceProductCodeItem[];
}

export interface PieceProductUpdateRequest extends PieceProductRequest {
  regulatoryAttributes?: string;
  nmpaCodeVersion?: string;
  status: 'ACTIVE' | 'INACTIVE';
  validFrom: string;
  validTo?: string;
}

export interface CodeSchemeResponse {
  schemeId: string;
  schemeCode: string;
  schemeName: string;
  issuerType: string;
  validationJson: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  lockVersion?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CodeSchemePage {
  records: CodeSchemeResponse[];
  total: number;
  page: number;
  size: number;
}

export interface CodeSchemeCreateRequest {
  schemeCode: string;
  schemeName: string;
  issuerType: string;
  validationJson: string;
}

export interface CodeSchemeUpdateRequest {
  schemeName: string;
  issuerType: string;
  validationJson: string;
  status: 'ACTIVE' | 'INACTIVE';
  lockVersion: number;
}

export interface CodeSchemeSegment {
  segmentId: string;
  schemeId: string;
  segmentNo: number;
  startPos: number;
  segmentLength: number;
  semanticCode: string;
  ruleJson: string;
  createdAt?: string;
}

export interface CodeSchemeSegmentRequest {
  segmentNo: number;
  startPos: number;
  segmentLength: number;
  semanticCode: string;
  ruleJson: string;
}

export interface CodeValidationResponse {
  schemeCode: string;
  normalizedCode?: string;
  valid: boolean;
  errorCode?: string;
  segments?: Array<{
    segmentNo?: number;
    semanticCode?: string;
    value?: string;
    valid?: boolean;
    errorCode?: string;
  }>;
}

export const masterDataApi = {
  getPartyPage(params: Record<string, string | number | undefined>): Promise<{ records: PartyManagement[]; total: number }> {
    return request.get('/openapi/v1/parties', { params });
  },
  getPartyById(id: string): Promise<PartyManagement> {
    return request.get('/openapi/v1/parties/' + encodeURIComponent(id));
  },
  updateParty(id: string, data: PartyCreateRequest & { status: string; lockVersion: number }): Promise<PartyManagement> {
    return request.post('/openapi/v1/parties/' + encodeURIComponent(id), data);
  },
  getBindingPage(params: Record<string, string | number | undefined>): Promise<{ records: IdentifierBindingManagement[]; total: number }> {
    return request.get('/openapi/v1/identifiers/bindings', { params });
  },
  getBindingById(id: string): Promise<IdentifierBindingManagement> {
    return request.get('/openapi/v1/identifiers/bindings/' + encodeURIComponent(id));
  },
  updateBinding(id: string, data: { status: string; validTo?: string }): Promise<IdentifierBindingManagement> {
    return request.post('/openapi/v1/identifiers/bindings/' + encodeURIComponent(id), data);
  },
  registerParty(data: PartyCreateRequest): Promise<PartyResponse> {
    return request.post<PartyResponse, PartyResponse>('/openapi/v1/parties', data);
  },

  registerNamespace(data: NamespaceDefRequest): Promise<NamespaceDefResponse> {
    return request.post<NamespaceDefResponse, NamespaceDefResponse>('/openapi/v1/identifiers/namespaces', data);
  },

  async getNamespacePage(params?: {
    namespaceCode?: string;
    namespaceName?: string;
    targetType?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<NamespacePage> {
    const query = new URLSearchParams();
    if (params?.namespaceCode) query.set('namespaceCode', params.namespaceCode);
    if (params?.namespaceName) query.set('namespaceName', params.namespaceName);
    if (params?.targetType) query.set('targetType', params.targetType);
    if (params?.status) query.set('status', params.status);
    query.set('page', String(params?.page || 1));
    query.set('size', String(params?.size || 20));
    const response: any = await request.get('/openapi/v1/identifiers/namespaces?' + query.toString());
    return {
      records: Array.isArray(response?.records) ? response.records : [],
      total: Number(response?.total ?? 0),
      page: Number(response?.page ?? params?.page ?? 1),
      size: Number(response?.size ?? params?.size ?? 20)
    };
  },

  async getNamespaceById(id: string): Promise<NamespaceDefResponse> {
    return request.get<NamespaceDefResponse, NamespaceDefResponse>('/openapi/v1/identifiers/namespaces/' + encodeURIComponent(id));
  },

  async updateNamespace(id: string, data: NamespaceUpdateRequest): Promise<NamespaceDefResponse> {
    return request.post<NamespaceDefResponse, NamespaceDefResponse>(
      '/openapi/v1/identifiers/namespaces/' + encodeURIComponent(id),
      data
    );
  },

  registerBusinessObject(data: BusinessObjectRequest): Promise<BusinessObjectResponse> {
    return request.post<BusinessObjectResponse, BusinessObjectResponse>('/openapi/v1/business-objects', data);
  },

  async getBusinessObjectPage(params?: {
    projectSpaceId?: string;
    objectType?: string;
    ownerPartyId?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<BusinessObjectPage> {
    const query = new URLSearchParams();
    if (params?.projectSpaceId) query.set('projectSpaceId', params.projectSpaceId);
    if (params?.objectType) query.set('objectType', params.objectType);
    if (params?.ownerPartyId) query.set('ownerPartyId', params.ownerPartyId);
    if (params?.status) query.set('status', params.status);
    query.set('page', String(params?.page || 1));
    query.set('size', String(params?.size || 20));
    const response: any = await request.get('/openapi/v1/business-objects?' + query.toString());
    return {
      records: Array.isArray(response?.records) ? response.records : [],
      total: Number(response?.total ?? 0),
      page: Number(response?.page ?? params?.page ?? 1),
      size: Number(response?.size ?? params?.size ?? 20)
    };
  },

  getBusinessObjectById(id: string): Promise<BusinessObjectDetailResponse> {
    return request.get<BusinessObjectDetailResponse, BusinessObjectDetailResponse>(
      '/openapi/v1/business-objects/' + encodeURIComponent(id)
    );
  },

  updateBusinessObject(id: string, data: BusinessObjectUpdateRequest): Promise<BusinessObjectDetailResponse> {
    return request.post<BusinessObjectDetailResponse, BusinessObjectDetailResponse>(
      '/openapi/v1/business-objects/' + encodeURIComponent(id),
      data
    );
  },

  resolveIdentifier(data: IdentifierResolveRequest): Promise<IdentifierResolutionResponse> {
    return request.post<IdentifierResolutionResponse, IdentifierResolutionResponse>('/openapi/v1/identifiers/resolve', data);
  },

  bindIdentifier(data: IdentifierBindingRequest): Promise<IdentifierBindingResponse> {
    return request.post<IdentifierBindingResponse, IdentifierBindingResponse>('/openapi/v1/identifiers/bindings', data);
  },

  async getPieceProductPage(params?: {
    productName?: string; materialName?: string; processingMethod?: string;
    medicalInsuranceCode?: string; nmpaPieceCode?: string; status?: string;
    page?: number; size?: number;
  }): Promise<PieceProductPage> {
    const query = new URLSearchParams();
    (['productName', 'materialName', 'processingMethod', 'medicalInsuranceCode', 'nmpaPieceCode', 'status'] as const).forEach(key => {
      if (params?.[key]) query.set(key, params[key] as string);
    });
    query.set('page', String(params?.page || 1)); query.set('size', String(params?.size || 20));
    const response: any = await request.get('/openapi/v1/decoction-piece-products?' + query.toString());
    return { records: Array.isArray(response?.records) ? response.records : [], total: Number(response?.total ?? 0), page: Number(response?.page ?? params?.page ?? 1), size: Number(response?.size ?? params?.size ?? 20) };
  },

  createPieceProduct(data: PieceProductRequest): Promise<PieceProductDetailResponse> {
    return request.post<PieceProductDetailResponse, PieceProductDetailResponse>('/openapi/v1/decoction-piece-products', data);
  },

  getPieceProductById(id: string): Promise<PieceProductDetailResponse> {
    return request.get<PieceProductDetailResponse, PieceProductDetailResponse>('/openapi/v1/decoction-piece-products/' + encodeURIComponent(id));
  },

  updatePieceProduct(id: string, data: PieceProductUpdateRequest): Promise<PieceProductDetailResponse> {
    return request.post<PieceProductDetailResponse, PieceProductDetailResponse>('/openapi/v1/decoction-piece-products/' + encodeURIComponent(id), data);
  },

  disablePieceProduct(id: string): Promise<void> {
    return request.post<void, void>('/openapi/v1/decoction-piece-products/' + encodeURIComponent(id) + '/delete');
  },

  async getCodeSchemePage(params?: { schemeCode?: string; schemeName?: string; issuerType?: string; status?: string; page?: number; size?: number }): Promise<CodeSchemePage> {
    const query = new URLSearchParams();
    (['schemeCode', 'schemeName', 'issuerType', 'status'] as const).forEach(key => { if (params?.[key]) query.set(key, params[key] as string); });
    query.set('page', String(params?.page || 1)); query.set('size', String(params?.size || 20));
    const response: any = await request.get('/openapi/v1/code-schemes?' + query.toString());
    return { records: Array.isArray(response?.records) ? response.records : [], total: Number(response?.total ?? 0), page: Number(response?.page ?? params?.page ?? 1), size: Number(response?.size ?? params?.size ?? 20) };
  },

  createCodeScheme(data: CodeSchemeCreateRequest): Promise<CodeSchemeResponse> {
    return request.post<CodeSchemeResponse, CodeSchemeResponse>('/openapi/v1/code-schemes', data);
  },

  getCodeSchemeById(id: string): Promise<CodeSchemeResponse> {
    return request.get<CodeSchemeResponse, CodeSchemeResponse>('/openapi/v1/code-schemes/' + encodeURIComponent(id));
  },

  updateCodeScheme(id: string, data: CodeSchemeUpdateRequest): Promise<CodeSchemeResponse> {
    return request.post<CodeSchemeResponse, CodeSchemeResponse>('/openapi/v1/code-schemes/' + encodeURIComponent(id), data);
  },

  disableCodeScheme(id: string): Promise<void> {
    return request.post<void, void>('/openapi/v1/code-schemes/' + encodeURIComponent(id) + '/delete');
  },

  getCodeSchemeSegments(schemeId: string): Promise<CodeSchemeSegment[]> {
    return request.get<CodeSchemeSegment[], CodeSchemeSegment[]>('/openapi/v1/code-schemes/' + encodeURIComponent(schemeId) + '/segments');
  },

  getCodeSchemeSegment(schemeId: string, segmentId: string): Promise<CodeSchemeSegment> {
    return request.get<CodeSchemeSegment, CodeSchemeSegment>(
      '/openapi/v1/code-schemes/' + encodeURIComponent(schemeId) + '/segments/' + encodeURIComponent(segmentId)
    );
  },

  createCodeSchemeSegment(schemeId: string, data: CodeSchemeSegmentRequest): Promise<CodeSchemeSegment> {
    return request.post<CodeSchemeSegment, CodeSchemeSegment>('/openapi/v1/code-schemes/' + encodeURIComponent(schemeId) + '/segments', data);
  },

  updateCodeSchemeSegment(schemeId: string, segmentId: string, data: CodeSchemeSegmentRequest): Promise<CodeSchemeSegment> {
    return request.post<CodeSchemeSegment, CodeSchemeSegment>('/openapi/v1/code-schemes/' + encodeURIComponent(schemeId) + '/segments/' + encodeURIComponent(segmentId), data);
  },

  deleteCodeSchemeSegment(schemeId: string, segmentId: string): Promise<void> {
    return request.post<void, void>('/openapi/v1/code-schemes/' + encodeURIComponent(schemeId) + '/segments/' + encodeURIComponent(segmentId) + '/delete');
  },

  validateCode(data: { schemeCode: string; rawCode: string; effectiveAt?: string }): Promise<CodeValidationResponse> {
    return request.post<CodeValidationResponse, CodeValidationResponse>('/openapi/v1/code-schemes/validate', data);
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
