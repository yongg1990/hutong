import { request } from './client';

export interface DataElement {
  id: string;
  elementCode: string;
  elementName: string;
  dataType: string;
  valueSetCode?: string;
  securityClass: string;
  sourceReference?: string;
  status: string;
  lockVersion: number;
  maxLength?: number;
  numericPrecision?: number;
  numericScale?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ValueSet {
  valueSetId: string;
  valueSetCode: string;
  valueSetName: string;
  version: string;
  status: string;
  itemCount?: string;
}

export interface ValueSetItem {
  itemId: string;
  valueSetId: string;
  itemCode: string;
  itemName: string;
  validFrom: string;
  validTo?: string;
  attributes?: Record<string, unknown>;
  status: string;
}

interface Page<T> { records: T[]; total: string; page: string; size: string }
type DataElementInput = Pick<DataElement, 'elementCode' | 'elementName' | 'dataType' | 'securityClass' | 'valueSetCode' | 'maxLength' | 'numericPrecision' | 'numericScale' | 'sourceReference'>;
type ItemInput = Pick<ValueSetItem, 'itemCode' | 'itemName' | 'validFrom' | 'validTo' | 'attributes'>;

export const standardsApi = {
  getDataElement: (id: string) => request.get<DataElement, DataElement>(`/openapi/v1/data-elements/${encodeURIComponent(id)}`),
  getValueSet: (id: string) => request.get<ValueSet, ValueSet>(`/openapi/v1/value-sets/${encodeURIComponent(id)}`),
  getItem: (valueSetId: string, itemId: string) => request.get<ValueSetItem, ValueSetItem>(`/openapi/v1/value-sets/${encodeURIComponent(valueSetId)}/items/${encodeURIComponent(itemId)}`),
  activeItems: (id: string) => request.get<ValueSetItem[], ValueSetItem[]>(`/openapi/v1/value-sets/${encodeURIComponent(id)}/items/active`),
  dataElements: (params: Record<string, string | number>) => request.get<Page<DataElement>, Page<DataElement>>('/openapi/v1/data-elements', { params }),
  createDataElement: (data: DataElementInput) => request.post<DataElement, DataElement>('/openapi/v1/data-elements', data),
  updateDataElement: (id: string, data: Omit<DataElementInput, 'elementCode'> & { lockVersion: number }) => request.post<DataElement, DataElement>(`/openapi/v1/data-elements/${encodeURIComponent(id)}`, data),
  setDataElementStatus: (id: string, status: string, lockVersion: number) => request.post<DataElement, DataElement>(`/openapi/v1/data-elements/${encodeURIComponent(id)}/status`, { status, lockVersion }),
  valueSets: (params: Record<string, string | number>) => request.get<Page<ValueSet>, Page<ValueSet>>('/openapi/v1/value-sets', { params }),
  createValueSet: (data: { valueSetCode: string; valueSetName: string; version: string }) => request.post<ValueSet, ValueSet>('/openapi/v1/value-sets', data),
  updateValueSet: (id: string, valueSetName: string) => request.post<ValueSet, ValueSet>(`/openapi/v1/value-sets/${encodeURIComponent(id)}`, { valueSetName }),
  setValueSetStatus: (id: string, status: string) => request.post<ValueSet, ValueSet>(`/openapi/v1/value-sets/${encodeURIComponent(id)}/status`, { status }),
  items: (id: string, params: Record<string, string | number>) => request.get<Page<ValueSetItem>, Page<ValueSetItem>>(`/openapi/v1/value-sets/${encodeURIComponent(id)}/items`, { params }),
  createItem: (id: string, data: ItemInput) => request.post<ValueSetItem, ValueSetItem>(`/openapi/v1/value-sets/${encodeURIComponent(id)}/items`, data),
  updateItem: (valueSetId: string, itemId: string, data: Omit<ItemInput, 'itemCode'>) => request.post<ValueSetItem, ValueSetItem>(`/openapi/v1/value-sets/${encodeURIComponent(valueSetId)}/items/${encodeURIComponent(itemId)}`, data),
  setItemStatus: (valueSetId: string, itemId: string, status: string) => request.post<ValueSetItem, ValueSetItem>(`/openapi/v1/value-sets/${encodeURIComponent(valueSetId)}/items/${encodeURIComponent(itemId)}/status`, { status })
};
