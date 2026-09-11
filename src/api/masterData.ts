import { request, apiCall } from './client';
import { mockMasterParties, mockMasterObjects, mockHerbPieces } from './mockData';
import type { MasterParty, MasterObject, HerbPiece } from '@/types';

export interface PartyCreateRequest {
  partyType: string;
  partyName: string;
  regionCode: string;
  attributes?: Record<string, any>;
}

export interface PartyResponse {
  partyId: number | string;
  status: string;
}

export interface BusinessObjectRequest {
  projectSpaceId: number | string;
  objectType: string;
  ownerPartyId: number | string;
  attributes?: Record<string, any>;
  sourceBusinessKey?: string;
}

export interface BusinessObjectResponse {
  objectId: number | string;
  versionNo: number | string;
}

export interface PieceProductCodeItem {
  schemeCode: string;
  code: string;
  validFrom?: string;
  validTo?: string;
  sourceAuthority?: string;
}

export interface PieceProductRequest {
  productName: string;
  materialName?: string;
  processingMethod?: string;
  specification?: string;
  executiveStandard?: string;
  codes?: PieceProductCodeItem[];
}

export interface PieceProductResponse {
  productId: number | string;
}

export interface IdentifierResolveRequest {
  sourceSystemId: number | string;
  namespaceCode: string;
  identifierValue: string;
  targetType: string;
}

export interface IdentifierResolutionResponse {
  resolutionStatus: 'RESOLVED' | 'NOT_FOUND' | 'AMBIGUOUS' | 'INACTIVE' | string;
  targetId?: number | string;
  candidateIds?: (number | string)[];
}

export interface IdentifierBindingRequest {
  targetType: string;
  targetId: number | string;
  sourceSystemId: number | string;
  namespaceCode: string;
  identifierValue: string;
  validFrom?: string;
}

export interface IdentifierBindingResponse {
  bindingId: number | string;
  status: string;
}

/**
 * 主数据管理接口 (Swagger: /openapi/v1/* & /master/*)
 */
export const masterDataApi = {
  // 获取主体机构列表 GET /master/parties
  async getMasterParties(params?: {
    keyword?: string;
    partyType?: string;
  }): Promise<MasterParty[]> {
    return apiCall(
      request.get('/master/parties', { params }),
      mockMasterParties.filter(p => {
        if (params?.partyType && p.partyType !== params.partyType) return false;
        if (params?.keyword) {
          const kw = params.keyword.toLowerCase();
          return (p.partyName || '').toLowerCase().includes(kw) ||
            (p.partyCode || '').toLowerCase().includes(kw) ||
            (p.region || '').toLowerCase().includes(kw);
        }
        return true;
      }),
      '获取主体机构列表'
    );
  },

  // 创建/注册主体机构 POST /openapi/v1/parties
  async createMasterParty(payload: {
    partyName: string;
    partyType: string;
    partyCode?: string;
    region?: string;
    regionCode?: string;
    attributes?: Record<string, any>;
  }): Promise<MasterParty> {
    const regionCode = payload.regionCode || '530100';
    const newParty: MasterParty = {
      id: `PARTY-${Date.now().toString().slice(-4)}`,
      partyCode: payload.partyCode || `PT-YN-${Date.now().toString().slice(-3)}`,
      partyName: payload.partyName,
      partyType: payload.partyType as any,
      region: payload.region || '云南省昆明市',
      externalCodeCount: 1,
      status: 'ACTIVE'
    };

    return apiCall(
      request.post('/openapi/v1/parties', {
        partyType: payload.partyType,
        partyName: payload.partyName,
        regionCode,
        attributes: JSON.stringify({
          partyCode: newParty.partyCode,
          region: newParty.region,
          ...(payload.attributes || {})
        })
      }).then((res: any) => {
        return {
          ...newParty,
          id: String(res?.partyId || newParty.id)
        };
      }),
      newParty,
      '创建主体机构'
    );
  },

  // 外部标识解析与消解 POST /openapi/v1/identifiers-resolve
  async resolveIdentifier(data: IdentifierResolveRequest): Promise<IdentifierResolutionResponse> {
    return apiCall(
      request.post('/openapi/v1/identifiers-resolve', data),
      {
        resolutionStatus: 'RESOLVED',
        targetId: 101,
        candidateIds: [101, 102]
      },
      '解析外部标识'
    );
  },

  // 外部标识绑定登记 POST /openapi/v1/identifier-bindings
  async bindIdentifier(data: IdentifierBindingRequest): Promise<IdentifierBindingResponse> {
    return apiCall(
      request.post('/openapi/v1/identifier-bindings', data),
      {
        bindingId: Date.now(),
        status: 'ACTIVE'
      },
      '绑定外部标识'
    );
  },

  // 歧义消解兼容方法
  async resolvePartyAmbiguity(payload: {
    inputName: string;
    selectedPartyId: string | number;
    resolvedCode?: string;
  }): Promise<{ success: boolean; selectedPartyId: string }> {
    return apiCall(
      request.post('/openapi/v1/identifiers-resolve', {
        sourceSystemId: 1,
        namespaceCode: 'NAME',
        identifierValue: payload.inputName,
        targetType: 'PARTY'
      }).then(() => ({ success: true, selectedPartyId: String(payload.selectedPartyId) })),
      { success: true, selectedPartyId: String(payload.selectedPartyId) },
      '完成主体歧义消解'
    );
  },

  // 获取业务对象列表 GET /master/objects
  async getMasterObjects(params?: {
    keyword?: string;
    objectType?: string;
  }): Promise<MasterObject[]> {
    return apiCall(
      request.get('/master/objects', { params }),
      mockMasterObjects.filter(o => {
        if (params?.objectType && o.objectType !== params.objectType) return false;
        if (params?.keyword) {
          const kw = params.keyword.toLowerCase();
          return (o.objectCode || '').toLowerCase().includes(kw) ||
            (o.displayName || '').toLowerCase().includes(kw) ||
            (o.ownerParty || '').toLowerCase().includes(kw);
        }
        return true;
      }),
      '获取业务对象列表'
    );
  },

  // 创建业务对象主数据 POST /openapi/v1/business-objects
  async createMasterObject(payload: {
    objectCode: string;
    displayName: string;
    objectType: string;
    ownerParty?: string;
    ownerPartyId?: number | string;
    projectSpaceId?: number | string;
    attributes?: Record<string, any>;
    sourceBusinessKey?: string;
  }): Promise<MasterObject> {
    const newObj: MasterObject = {
      id: `OBJ-${Date.now().toString().slice(-4)}`,
      objectCode: payload.objectCode || `OBJ-${Date.now().toString().slice(-6)}`,
      objectType: payload.objectType as any,
      displayName: payload.displayName || '新业务对象',
      ownerParty: payload.ownerParty || '文山三七标准化种植示范基地',
      version: '1.0',
      lastEventTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'ACTIVE'
    };

    return apiCall(
      request.post('/openapi/v1/business-objects', {
        projectSpaceId: Number(payload.projectSpaceId) || 1,
        objectType: payload.objectType,
        ownerPartyId: Number(payload.ownerPartyId) || 1,
        attributes: JSON.stringify({
          objectCode: newObj.objectCode,
          displayName: newObj.displayName,
          ownerParty: newObj.ownerParty,
          ...(payload.attributes || {})
        }),
        sourceBusinessKey: payload.sourceBusinessKey || newObj.objectCode
      }).then((res: any) => {
        return {
          ...newObj,
          id: String(res?.objectId || newObj.id),
          version: String(res?.versionNo || newObj.version)
        };
      }),
      newObj,
      '创建业务对象主数据'
    );
  },

  // 获取饮片品种与编码列表 GET /master/decoction-pieces
  async getHerbPieces(params?: {
    keyword?: string;
  }): Promise<HerbPiece[]> {
    return apiCall(
      request.get('/master/decoction-pieces', { params }),
      mockHerbPieces.filter(p => {
        if (params?.keyword) {
          const kw = params.keyword.toLowerCase();
          return (p.speciesName || '').toLowerCase().includes(kw) ||
            (p.batchNo || '').toLowerCase().includes(kw) ||
            (p.medicalInsuranceCode || '').includes(kw);
        }
        return true;
      }),
      '获取饮片与监管编码列表'
    );
  },

  // 新增/关联饮片产品与监管编码 POST /openapi/v1/decoction-piece-products
  async createHerbPiece(payload: Partial<HerbPiece> & {
    executiveStandard?: string;
  }): Promise<HerbPiece> {
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
      }).then((res: any) => {
        return {
          ...newPiece,
          id: String(res?.productId || newPiece.id)
        };
      }),
      newPiece,
      '保存饮片编码主数据'
    );
  }
};
